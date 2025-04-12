"""
Service for code analysis and processing.
"""
import re
import ast
import json
from typing import List, Dict, Any, Optional, Union, Tuple
import base64
from pathlib import Path
from github import Github

# Import providers conditionally
try:
    import openai
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from app.core.config import (
    GITHUB_ACCESS_TOKEN,
    OPENAI_API_KEY,
    COMPLETION_MODEL,
    USE_VERTEX_AI
)
from app.core.logging_config import get_logger
from app.api.models import CodeSource, Technology, CodeAnalysisResult, GithubRepo
from app.utils.rate_limiter import rate_limited, llm_rate_limiter

# Import Vertex AI service if enabled
if USE_VERTEX_AI:
    from app.services.vertex_service import VertexAIService

logger = get_logger(__name__)


class CodeService:
    """Service for code analysis and processing."""
    
    def __init__(self):
        """Initialize the code service."""
        self.github_token = GITHUB_ACCESS_TOKEN
        
        # Initialize the appropriate text generation service
        if USE_VERTEX_AI:
            logger.info("Using Vertex AI for code analysis")
            self.vertex_service = VertexAIService()
            self.use_vertex = True
        elif OPENAI_AVAILABLE and OPENAI_API_KEY:
            logger.info(f"Using OpenAI for code analysis: {COMPLETION_MODEL}")
            self.client = OpenAI(api_key=OPENAI_API_KEY)
            self.completion_model = COMPLETION_MODEL
            self.use_vertex = False
        else:
            logger.warning("No text generation service available for code analysis")
            self.client = None
            self.use_vertex = False
    
    def get_code_from_github(self, repo_details: GithubRepo) -> Tuple[str, str]:
        """
        Retrieve code from GitHub.
        
        Args:
            repo_details: GitHub repository details
            
        Returns:
            Tuple of code content and file path
        """
        if not self.github_token:
            logger.error("GitHub token not provided")
            return "Error: GitHub token not provided", ""
        
        try:
            # Initialize GitHub client
            g = Github(self.github_token)
            
            # Get repository
            repo = g.get_repo(f"{repo_details.owner}/{repo_details.repo}")
            
            # Get content
            if repo_details.path:
                # Get specific file or directory
                content = repo.get_contents(repo_details.path, ref=repo_details.branch)
                
                # If it's a file, return its content
                if not isinstance(content, list):
                    file_content = content.decoded_content.decode('utf-8')
                    return file_content, content.path
                
                # If it's a directory, return concatenated content of all files
                files_content = []
                for file in content:
                    if file.type == "file" and self._is_code_file(file.path):
                        try:
                            file_content = file.decoded_content.decode('utf-8')
                            files_content.append(f"# File: {file.path}\n\n{file_content}\n\n")
                        except Exception as e:
                            logger.error(f"Error decoding file {file.path}: {str(e)}")
                
                return "\n".join(files_content), repo_details.path
            else:
                # Get repository structure
                root_content = repo.get_contents("", ref=repo_details.branch)
                files_content = []
                
                # Process up to 10 code files
                file_count = 0
                for item in root_content:
                    if item.type == "file" and self._is_code_file(item.path) and file_count < 10:
                        try:
                            file_content = item.decoded_content.decode('utf-8')
                            files_content.append(f"# File: {item.path}\n\n{file_content}\n\n")
                            file_count += 1
                        except Exception as e:
                            logger.error(f"Error decoding file {item.path}: {str(e)}")
                
                return "\n".join(files_content), "Repository root"
                
        except Exception as e:
            logger.error(f"Error fetching from GitHub: {str(e)}")
            return f"Error: {str(e)}", ""
    
    def _is_code_file(self, file_path: str) -> bool:
        """
        Check if a file is a code file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            True if it's a code file, False otherwise
        """
        code_extensions = [
            '.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', 
            '.java', '.c', '.cpp', '.h', '.cs', '.php', '.rb', 
            '.go', '.rs', '.swift', '.kt', '.scala', '.sh', 
            '.json', '.yml', '.yaml'
        ]
        
        return any(file_path.endswith(ext) for ext in code_extensions)
    
    def parse_python_code(self, code: str) -> Dict[str, Any]:
        """
        Parse Python code to extract structure and details.
        
        Args:
            code: Python code to parse
            
        Returns:
            Dictionary with code structure and details
        """
        result = {
            "imports": [],
            "functions": [],
            "classes": [],
            "variables": [],
            "errors": []
        }
        
        try:
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                # Extract imports
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    if isinstance(node, ast.Import):
                        for name in node.names:
                            result["imports"].append({
                                "name": name.name,
                                "alias": name.asname
                            })
                    else:  # ImportFrom
                        module = node.module or ""
                        for name in node.names:
                            result["imports"].append({
                                "name": f"{module}.{name.name}" if module else name.name,
                                "alias": name.asname
                            })
                
                # Extract functions
                elif isinstance(node, ast.FunctionDef):
                    result["functions"].append({
                        "name": node.name,
                        "args": [arg.arg for arg in node.args.args],
                        "decorators": [self._get_decorator_name(d) for d in node.decorator_list],
                        "line_number": node.lineno
                    })
                
                # Extract classes
                elif isinstance(node, ast.ClassDef):
                    result["classes"].append({
                        "name": node.name,
                        "bases": [self._get_name(base) for base in node.bases],
                        "methods": [m.name for m in node.body if isinstance(m, ast.FunctionDef)],
                        "line_number": node.lineno
                    })
                
                # Extract global variables
                elif isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name) and node.col_offset == 0:
                    result["variables"].append({
                        "name": node.targets[0].id,
                        "line_number": node.lineno
                    })
            
        except SyntaxError as e:
            result["errors"].append({
                "type": "SyntaxError",
                "message": str(e),
                "line": e.lineno,
                "offset": e.offset
            })
        except Exception as e:
            result["errors"].append({
                "type": type(e).__name__,
                "message": str(e)
            })
        
        return result
    
    def _get_decorator_name(self, decorator: ast.expr) -> str:
        """
        Get the name of a decorator.
        
        Args:
            decorator: AST decorator node
            
        Returns:
            Decorator name as string
        """
        if isinstance(decorator, ast.Name):
            return decorator.id
        elif isinstance(decorator, ast.Call):
            if isinstance(decorator.func, ast.Name):
                return decorator.func.id
            elif isinstance(decorator.func, ast.Attribute):
                return self._get_name(decorator.func)
        elif isinstance(decorator, ast.Attribute):
            return self._get_name(decorator)
        return "unknown"
    
    def _get_name(self, node: ast.expr) -> str:
        """
        Get the name from an AST node.
        
        Args:
            node: AST node
            
        Returns:
            Name as string
        """
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_name(node.value)}.{node.attr}"
        return "unknown"
    
    def analyze_javascript_code(self, code: str) -> Dict[str, Any]:
        """
        Analyze JavaScript/TypeScript code structure.
        This is a simplified analysis since full parsing would require a JS parser.
        
        Args:
            code: JavaScript/TypeScript code to analyze
            
        Returns:
            Dictionary with code structure and details
        """
        result = {
            "imports": [],
            "functions": [],
            "classes": [],
            "components": [],  # React components
            "hooks": [],  # React hooks usage
            "errors": []
        }
        
        # Extract imports
        import_regex = r'(?:import|require)\s*\(?[\s\n]*[{]?[\s\n]*([^;{}]*?)[\s\n]*[}]?[\s\n]*from\s*[\'"]([^\'"]+)[\'"]'
        for match in re.finditer(import_regex, code):
            try:
                imported = match.group(1).strip()
                source = match.group(2).strip()
                result["imports"].append({
                    "imported": imported,
                    "source": source
                })
            except Exception as e:
                result["errors"].append({
                    "type": "ImportParseError",
                    "message": str(e)
                })
        
        # Extract functions
        function_regex = r'(?:function|const|let|var)\s+([a-zA-Z0-9_$]+)\s*(?:=\s*(?:function|\([^)]*\)\s*=>)|[({])'
        for match in re.finditer(function_regex, code):
            try:
                name = match.group(1).strip()
                result["functions"].append({
                    "name": name,
                    "line_number": code[:match.start()].count('\n') + 1
                })
            except Exception as e:
                result["errors"].append({
                    "type": "FunctionParseError",
                    "message": str(e)
                })
        
        # Extract classes
        class_regex = r'class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+([a-zA-Z0-9_$.]+))?'
        for match in re.finditer(class_regex, code):
            try:
                name = match.group(1).strip()
                extends = match.group(2).strip() if match.group(2) else None
                result["classes"].append({
                    "name": name,
                    "extends": extends,
                    "line_number": code[:match.start()].count('\n') + 1
                })
            except Exception as e:
                result["errors"].append({
                    "type": "ClassParseError",
                    "message": str(e)
                })
        
        # Extract React components
        component_regex = r'(?:const|let|var)\s+([A-Z][a-zA-Z0-9_$]*)\s*=\s*(?:React\.)?(?:memo|forwardRef|createClass)?\(?(?:\s*\([^)]*\)\s*=>\s*|function\s*\([^)]*\)\s*\{)'
        for match in re.finditer(component_regex, code):
            try:
                name = match.group(1).strip()
                result["components"].append({
                    "name": name,
                    "line_number": code[:match.start()].count('\n') + 1
                })
            except Exception as e:
                result["errors"].append({
                    "type": "ComponentParseError",
                    "message": str(e)
                })
        
        # Extract React hooks usage
        hook_regex = r'use[A-Z][a-zA-Z0-9_$]*\s*\('
        for match in re.finditer(hook_regex, code):
            try:
                hook_name = code[match.start():match.end()-1].strip()
                result["hooks"].append({
                    "name": hook_name,
                    "line_number": code[:match.start()].count('\n') + 1
                })
            except Exception as e:
                result["errors"].append({
                    "type": "HookParseError",
                    "message": str(e)
                })
        
        return result
    
    @rate_limited(llm_rate_limiter)
    def analyze_code(self, code: str, technology: Technology) -> CodeAnalysisResult:
        """
        Analyze code using LLM and syntax parsing.
        
        Args:
            code: Code to analyze
            technology: Technology the code is written in
            
        Returns:
            Code analysis result
        """
        # Initialize result
        result = CodeAnalysisResult()
        
        # Perform basic static analysis based on technology
        parsed_data = None
        if technology == Technology.PYTHON:
            parsed_data = self.parse_python_code(code)
        elif technology in [Technology.JAVASCRIPT, Technology.TYPESCRIPT, Technology.REACT]:
            parsed_data = self.analyze_javascript_code(code)
        
        # Limit code size to prevent token issues
        code_sample = code[:15000] if len(code) > 15000 else code
        
        # Call LLM for deeper analysis
        prompt = f"""
        Analyze the following code and provide:
        1. A list of potential issues or bugs
        2. Improvement suggestions for code quality, performance, or security
        3. Any dependencies that should be noted
        4. A general complexity assessment (low, medium, high)
        
        CODE:
        ```{technology.value}
        {code_sample}
        ```
        
        Format your response as JSON:
        {{
            "issues": [
                {{"description": "Issue description", "severity": "low|medium|high", "line_number": optional_line_number}}
            ],
            "suggestions": [
                {{"description": "Suggestion description", "benefit": "Benefit description", "effort": "low|medium|high"}}
            ],
            "dependencies": ["list", "of", "dependencies"],
            "complexity_score": number_between_1_and_10,
            "analysis_details": {{
                "code_structure": "Brief description of code structure",
                "best_practices": "Assessment of adherence to best practices",
                "additional_notes": "Any other relevant information"
            }}
        }}
        """
        
        try:
            # Generate analysis using the appropriate service
            if self.use_vertex:
                response_text = self.vertex_service.generate_text(
                    prompt,
                    temperature=0.1,
                    max_output_tokens=4096
                )
                
                # Parse JSON from response
                try:
                    # Clean up response to ensure it's valid JSON
                    # Sometimes models add extra text before or after the JSON
                    json_str = self._extract_json_from_text(response_text)
                    analysis = json.loads(json_str)
                except Exception as json_err:
                    logger.error(f"Error parsing JSON from Vertex AI response: {json_err}")
                    logger.debug(f"Raw response: {response_text[:500]}")
                    # Create a basic fallback response
                    analysis = {
                        "issues": [{"description": "Error parsing analysis result", "severity": "medium"}],
                        "suggestions": [{"description": "Retry the analysis", "benefit": "Get proper analysis", "effort": "low"}],
                        "dependencies": [],
                        "complexity_score": 5,
                        "analysis_details": {"error": "JSON parsing error", "raw_response": response_text[:500]}
                    }
            elif OPENAI_AVAILABLE and self.client:
                response = self.client.chat.completions.create(
                    model=self.completion_model,
                    messages=[
                        {"role": "system", "content": "You are a code analysis assistant that provides detailed, accurate analysis."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.1
                )
                
                analysis = json.loads(response.choices[0].message.content)
            else:
                logger.warning("No text generation service available for code analysis")
                analysis = {
                    "issues": [{"description": "No analysis service available", "severity": "medium"}],
                    "suggestions": [],
                    "dependencies": [],
                    "complexity_score": 5,
                    "analysis_details": {"error": "No text generation service available"}
                }
            
            # Combine parsed data with LLM analysis
            if parsed_data:
                if "errors" in parsed_data and parsed_data["errors"]:
                    for error in parsed_data["errors"]:
                        analysis["issues"].append({
                            "description": f"Syntax error: {error.get('message', 'Unknown error')}",
                            "severity": "high",
                            "line_number": error.get("line")
                        })
                
                # Add information about detected components for React
                if technology == Technology.REACT and "components" in parsed_data:
                    components_info = [comp["name"] for comp in parsed_data.get("components", [])]
                    hooks_info = [hook["name"] for hook in parsed_data.get("hooks", [])]
                    
                    if components_info or hooks_info:
                        analysis["analysis_details"]["react_specific"] = {
                            "components": components_info,
                            "hooks": hooks_info
                        }
            
            # Create the result object
            result = CodeAnalysisResult(**analysis)
            
        except Exception as e:
            logger.error(f"Error analyzing code: {str(e)}")
            # Create basic result with error information
            result = CodeAnalysisResult(
                issues=[{"description": f"Error during analysis: {str(e)}", "severity": "medium"}],
                analysis_details={"error": str(e)}
            )
        
        return result
    
    def _extract_json_from_text(self, text: str) -> str:
        """
        Extract JSON object from text that might contain other content.
        
        Args:
            text: Text that contains JSON
            
        Returns:
            Extracted JSON string
        """
        # Try to find JSON object in the text
        json_match = re.search(r'(\{.*\})', text, re.DOTALL)
        if json_match:
            return json_match.group(1)
        
        # If no match, return the original text
        return text
    
    @rate_limited(llm_rate_limiter)
    def get_code_context(self, code: str, technology: Technology) -> str:
        """
        Generate a concise context description from code.

        Args:
            code: Code to generate context from
            technology: Technology the code is written in

        Returns:
            Context description
        """
        # Limit code size to prevent token issues
        code_sample = code[:10000] if len(code) > 10000 else code

        prompt = f"""
        Create a concise summary of the following code that can be used as context for questions about it.
        Include key structures, functionality, and patterns, but keep it under 500 words.

        CODE:
        ```{technology.value}
        {code_sample}
        ```
        """

        try:
            # Generate the context using the appropriate service
            if self.use_vertex:
                return self.vertex_service.generate_text(
                    prompt,
                    temperature=0.1,
                    max_output_tokens=1000
                )
            elif OPENAI_AVAILABLE and self.client:
                response = self.client.chat.completions.create(
                    model=self.completion_model,
                    messages=[
                        {"role": "system", "content": "You are a code summarization assistant that creates concise, accurate summaries."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    max_tokens=1000
                )
                return response.choices[0].message.content
            else:
                return "Unable to generate code context - no text generation service available"

        except Exception as e:
            logger.error(f"Error generating code context: {str(e)}")
            return f"[Error generating context: {str(e)}]"

    
    def process_code_from_source(
        self, 
        source: CodeSource, 
        technology: Technology,
        code_snippet: Optional[str] = None,
        github_repo: Optional[GithubRepo] = None
    ) -> Tuple[str, str]:
        """
        Process code from various sources.
        
        Args:
            source: Source of the code
            technology: Technology the code is in
            code_snippet: Code snippet if source is SNIPPET
            github_repo: GitHub repository details if source is GITHUB
            
        Returns:
            Tuple of code content and context
        """
        code = ""
        
        if source == CodeSource.SNIPPET and code_snippet:
            code = code_snippet
            logger.info(f"Processing code snippet ({len(code)} characters)")
        
        elif source == CodeSource.GITHUB and github_repo:
            code, file_path = self.get_code_from_github(github_repo)
            logger.info(f"Processed code from GitHub: {github_repo.owner}/{github_repo.repo} - {file_path}")
        
        elif source == CodeSource.FILE:
            # File handling would be implemented in the API endpoint
            code = "Code from file upload will be handled in the API endpoint"
            logger.warning("File processing not implemented in this method")
        
        else:
            logger.error(f"Invalid code source: {source}")
            return "Error: Invalid code source", ""
        
        # Generate context
        context = self.get_code_context(code, technology)
        
        return code, context