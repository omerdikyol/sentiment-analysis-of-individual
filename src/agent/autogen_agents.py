from typing import Dict, List, Any, Optional
import autogen
from pathlib import Path
import logging
import json
from datetime import datetime

logger = logging.getLogger('AutogenAgents')

class AutogenAgentSystem:
    def __init__(self, config_path: Path, llm_config: Optional[Dict[str, Any]] = None):
        self.config_path = config_path
        self.llm_config = llm_config or self._get_default_llm_config()
        
        # Initialize the agent group
        self.assistant = self._create_assistant()
        self.researcher = self._create_researcher()
        self.data_analyst = self._create_data_analyst()
        self.critic = self._create_critic()
        
        # Create group chat
        self.group_chat = self._create_group_chat()
        
    def _get_default_llm_config(self) -> Dict[str, Any]:
        """Get default LLM configuration"""
        return {
            "timeout": 600,
            "cache_seed": 42,
            "temperature": 0.7,
            "config_list": self._load_config_list(),
            "model": "gpt-4"
        }
    
    def _load_config_list(self) -> List[Dict[str, str]]:
        """Load API configurations"""
        config_file = self.config_path / 'llm_config.json'
        if config_file.exists():
            with open(config_file, 'r') as f:
                return json.load(f)
        return [{"model": "gpt-4", "api_key": "YOUR_API_KEY"}]  # Default config

    def _create_assistant(self) -> autogen.AssistantAgent:
        """Create the main assistant agent"""
        return autogen.AssistantAgent(
            name="assistant",
            system_message="""You are a highly capable AI assistant focused on sentiment analysis.
            Your role is to coordinate with other agents to analyze and process sentiment data effectively.
            You can understand complex requests and break them down into manageable tasks.""",
            llm_config=self.llm_config
        )

    def _create_researcher(self) -> autogen.AssistantAgent:
        """Create the researcher agent"""
        return autogen.AssistantAgent(
            name="researcher",
            system_message="""You are a research specialist focused on gathering and validating data.
            Your role is to ensure data quality and suggest improvements to data collection methods.
            You work closely with the data analyst to ensure data integrity.""",
            llm_config=self.llm_config
        )

    def _create_data_analyst(self) -> autogen.AssistantAgent:
        """Create the data analyst agent"""
        return autogen.AssistantAgent(
            name="data_analyst",
            system_message="""You are a data analysis expert specialized in sentiment analysis.
            Your role is to process and analyze sentiment data, identify patterns, and generate insights.
            You work with both structured and unstructured data to extract meaningful conclusions.""",
            llm_config=self.llm_config
        )

    def _create_critic(self) -> autogen.AssistantAgent:
        """Create the critic agent"""
        return autogen.AssistantAgent(
            name="critic",
            system_message="""You are a critical thinker and quality assurance specialist.
            Your role is to evaluate the work of other agents, identify potential issues,
            and suggest improvements to the analysis process.""",
            llm_config=self.llm_config
        )

    def _create_group_chat(self) -> autogen.GroupChat:
        """Create a group chat for agent collaboration"""
        return autogen.GroupChat(
            agents=[self.assistant, self.researcher, self.data_analyst, self.critic],
            messages=[],
            max_round=10
        )

    async def analyze_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform collaborative analysis using the agent group"""
        try:
            # Create the initial message
            initial_message = {
                "content": f"""Please analyze the following data and provide insights:
                {json.dumps(data, indent=2)}
                
                Please follow these steps:
                1. Researcher: Validate data quality and completeness
                2. Data Analyst: Perform sentiment analysis and pattern recognition
                3. Critic: Review findings and suggest improvements
                4. Assistant: Summarize key insights and recommendations""",
                "role": "user"
            }
            
            # Initialize the group chat manager
            manager = autogen.GroupChatManager(
                groupchat=self.group_chat,
                llm_config=self.llm_config
            )
            
            # Start the analysis
            result = await manager.run(initial_message)
            
            # Extract insights from the conversation
            insights = self._extract_insights(result)
            
            return {
                "timestamp": datetime.now().isoformat(),
                "insights": insights,
                "raw_conversation": result
            }
            
        except Exception as e:
            logger.error(f"Error in collaborative analysis: {str(e)}")
            return {
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def _extract_insights(self, conversation: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract key insights from the agent conversation"""
        insights = {
            "data_quality": {},
            "sentiment_analysis": {},
            "recommendations": [],
            "concerns": []
        }
        
        for message in conversation:
            if message["role"] == "researcher":
                insights["data_quality"] = self._parse_researcher_message(message["content"])
            elif message["role"] == "data_analyst":
                insights["sentiment_analysis"] = self._parse_analyst_message(message["content"])
            elif message["role"] == "critic":
                insights["concerns"] = self._parse_critic_message(message["content"])
            elif message["role"] == "assistant" and "summary" in message["content"].lower():
                insights["recommendations"] = self._parse_assistant_message(message["content"])
        
        return insights

    def _parse_researcher_message(self, content: str) -> Dict[str, Any]:
        """Parse researcher's message for data quality insights"""
        # Implementation would depend on the expected format of researcher's messages
        return {
            "completeness": self._extract_metric(content, "completeness"),
            "validity": self._extract_metric(content, "validity"),
            "issues": self._extract_list(content, "issues")
        }

    def _parse_analyst_message(self, content: str) -> Dict[str, Any]:
        """Parse data analyst's message for sentiment analysis results"""
        return {
            "overall_sentiment": self._extract_metric(content, "overall sentiment"),
            "confidence": self._extract_metric(content, "confidence"),
            "patterns": self._extract_list(content, "patterns")
        }

    def _parse_critic_message(self, content: str) -> List[str]:
        """Parse critic's message for concerns and improvements"""
        return self._extract_list(content, "concerns")

    def _parse_assistant_message(self, content: str) -> List[str]:
        """Parse assistant's message for recommendations"""
        return self._extract_list(content, "recommendations")

    def _extract_metric(self, content: str, metric_name: str) -> float:
        """Extract a metric value from text content"""
        try:
            # This is a simple implementation - could be enhanced with better parsing
            lines = content.lower().split('\n')
            for line in lines:
                if metric_name.lower() in line:
                    # Try to find a number in the line
                    import re
                    numbers = re.findall(r"[-+]?\d*\.\d+|\d+", line)
                    if numbers:
                        return float(numbers[0])
            return 0.0
        except:
            return 0.0

    def _extract_list(self, content: str, section_name: str) -> List[str]:
        """Extract a list of items from text content"""
        items = []
        try:
            lines = content.lower().split('\n')
            capturing = False
            for line in lines:
                if section_name.lower() in line:
                    capturing = True
                    continue
                if capturing and line.strip():
                    # Remove common list markers and clean the line
                    clean_line = line.strip().lstrip('•-*').strip()
                    if clean_line:
                        items.append(clean_line)
                if capturing and not line.strip():
                    capturing = False
        except:
            pass
        return items

    async def optimize_collection(self, performance_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Use agents to optimize data collection strategy"""
        try:
            message = {
                "content": f"""Please analyze the current data collection performance and suggest optimizations:
                {json.dumps(performance_metrics, indent=2)}
                
                Consider:
                1. Collection frequency
                2. Resource usage
                3. Data quality
                4. Success rates""",
                "role": "user"
            }
            
            manager = autogen.GroupChatManager(
                groupchat=self.group_chat,
                llm_config=self.llm_config
            )
            
            result = await manager.run(message)
            
            # Extract optimization suggestions
            optimizations = self._extract_optimizations(result)
            
            return {
                "timestamp": datetime.now().isoformat(),
                "optimizations": optimizations,
                "raw_conversation": result
            }
            
        except Exception as e:
            logger.error(f"Error in optimization analysis: {str(e)}")
            return {
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def _extract_optimizations(self, conversation: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract optimization suggestions from the agent conversation"""
        optimizations = {
            "collection_frequency": None,
            "resource_adjustments": [],
            "quality_improvements": [],
            "suggested_changes": []
        }
        
        for message in conversation:
            content = message["content"].lower()
            if "frequency" in content:
                optimizations["collection_frequency"] = self._extract_frequency(content)
            if "resource" in content:
                optimizations["resource_adjustments"].extend(self._extract_list(content, "resource"))
            if "quality" in content:
                optimizations["quality_improvements"].extend(self._extract_list(content, "quality"))
            if "suggest" in content or "recommend" in content:
                optimizations["suggested_changes"].extend(self._extract_list(content, "suggest"))
        
        return optimizations

    def _extract_frequency(self, content: str) -> Optional[int]:
        """Extract suggested collection frequency from text"""
        try:
            import re
            # Look for patterns like "every X minutes" or "X-minute interval"
            patterns = [
                r"every (\d+) minute",
                r"(\d+)[- ]minute interval",
                r"(\d+) min"
            ]
            for pattern in patterns:
                match = re.search(pattern, content)
                if match:
                    return int(match.group(1))
            return None
        except:
            return None 