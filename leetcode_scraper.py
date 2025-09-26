#!/usr/bin/env python3
"""
Working LeetCode Problem Scraper
Uses only Python standard library to scrape real problems from LeetCode.
"""

import json
import os
import time
import re
import urllib.request
import urllib.parse
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple

@dataclass
class LeetCodeProblem:
    id: int
    title: str
    slug: str
    difficulty: str
    category: str
    description: str
    examples: List[Dict[str, str]]
    top_solution: str
    acceptance_rate: float
    likes: int
    dislikes: int

class WorkingLeetCodeScraper:
    def __init__(self):
        self.base_url = "https://leetcode.com"
        
        # Category mapping
        self.category_mapping = {
            "Array": "arrays",
            "String": "strings",
            "Hash Table": "hash-tables",
            "Dynamic Programming": "dynamic-programming",
            "Math": "math",
            "Sorting": "sorting",
            "Greedy": "greedy",
            "Depth-First Search": "dfs",
            "Breadth-First Search": "bfs",
            "Tree": "trees",
            "Binary Search": "binary-search",
            "Matrix": "matrices",
            "Two Pointers": "two-pointers",
            "Bit Manipulation": "bit-manipulation",
            "Stack": "stacks",
            "Heap (Priority Queue)": "heaps",
            "Graph": "graphs",
            "Simulation": "simulation",
            "Backtracking": "backtracking",
            "Sliding Window": "sliding-window",
            "Union Find": "union-find",
            "Linked List": "linked-lists",
            "Trie": "tries",
            "Recursion": "recursion",
            "Binary Tree": "binary-trees",
            "Binary Search Tree": "binary-search-trees",
        }

    def make_request(self, url: str, data: Dict = None, headers: Dict = None) -> Optional[Dict]:
        """Make HTTP request using urllib"""
        try:
            if data:
                data_bytes = json.dumps(data).encode('utf-8')
                req = urllib.request.Request(
                    url,
                    data=data_bytes,
                    headers=headers or {}
                )
            else:
                req = urllib.request.Request(url, headers=headers or {})
            
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print(f"Request error: {e}")
            return None

    def get_problems_list(self, limit: int = 50) -> List[Dict]:
        """Get list of problems using GraphQL"""
        query = """
        query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
            problemsetQuestionList: questionList(
                categorySlug: $categorySlug
                limit: $limit
                skip: $skip
                filters: $filters
            ) {
                total: totalNum
                questions: data {
                    acRate
                    difficulty
                    frontendQuestionId: questionFrontendId
                    isFavor
                    paidOnly: isPaidOnly
                    status
                    title
                    titleSlug
                    topicTags {
                        name
                        id
                        slug
                    }
                    hasSolution
                    hasVideoSolution
                }
            }
        }
        """
        
        variables = {
            "categorySlug": "",
            "skip": 0,
            "limit": limit,
            "filters": {}
        }
        
        payload = {
            "query": query,
            "variables": variables
        }
        
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://leetcode.com/problemset/all/',
        }
        
        result = self.make_request(f"{self.base_url}/graphql/", payload, headers)
        
        if result:
            questions = result.get('data', {}).get('problemsetQuestionList', {}).get('questions', [])
            # Filter out paid problems and sort by acceptance rate
            free_questions = [q for q in questions if not q.get('paidOnly', False)]
            free_questions.sort(key=lambda x: x.get('acRate', 0), reverse=True)
            return free_questions
        
        return []

    def get_problem_content(self, slug: str) -> Optional[Dict]:
        """Get problem content using GraphQL"""
        query = """
        query questionContent($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
                content
                mysqlSchemas
                dataSchemas
            }
        }
        """
        
        variables = {"titleSlug": slug}
        payload = {"query": query, "variables": variables}
        
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        }
        
        result = self.make_request(f"{self.base_url}/graphql/", payload, headers)
        
        if result:
            return result.get('data', {}).get('question', {})
        
        return None

    def parse_problem_content(self, content: str) -> Tuple[str, List[Dict[str, str]]]:
        """Parse problem content to extract description and examples"""
        if not content:
            return "", []
        
        # Simple HTML tag removal
        content = re.sub(r'<[^>]+>', '', content)
        
        # Extract examples using regex
        examples = []
        example_pattern = r'Example \d+:\s*Input:\s*([^\n]+)\s*Output:\s*([^\n]+)'
        matches = re.findall(example_pattern, content, re.IGNORECASE | re.DOTALL)
        
        for match in matches:
            input_example = match[0].strip()
            output_example = match[1].strip()
            # Clean up the examples
            input_example = re.sub(r'\s+', ' ', input_example)
            output_example = re.sub(r'\s+', ' ', output_example)
            examples.append({
                "input": input_example,
                "output": output_example
            })
        
        # Get description (everything before examples)
        description = content
        if examples:
            # Find the first example and cut description there
            first_example_pos = content.find("Example 1:")
            if first_example_pos != -1:
                description = content[:first_example_pos].strip()
        
        # Clean up description
        description = re.sub(r'\s+', ' ', description)
        description = description.replace('\n', ' ').strip()
        
        return description, examples

    def generate_solution_template(self, title: str, difficulty: str) -> str:
        """Generate a basic solution template based on problem title"""
        # Simple solution templates based on common patterns
        if "Two Sum" in title:
            return """function twoSum(nums, target) {
    const map = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        
        map.set(nums[i], i);
    }
    
    return [];
}

module.exports = { twoSum };"""
        elif "Add Two Numbers" in title:
            return """function addTwoNumbers(l1, l2) {
    let dummy = new ListNode(0);
    let current = dummy;
    let carry = 0;
    
    while (l1 || l2 || carry) {
        const sum = (l1?.val || 0) + (l2?.val || 0) + carry;
        carry = Math.floor(sum / 10);
        current.next = new ListNode(sum % 10);
        current = current.next;
        
        l1 = l1?.next;
        l2 = l2?.next;
    }
    
    return dummy.next;
}

module.exports = { addTwoNumbers };"""
        elif "Longest Substring" in title:
            return """function lengthOfLongestSubstring(s) {
    const seen = new Set();
    let left = 0;
    let maxLength = 0;
    
    for (let right = 0; right < s.length; right++) {
        while (seen.has(s[right])) {
            seen.delete(s[left]);
            left++;
        }
        
        seen.add(s[right]);
        maxLength = Math.max(maxLength, right - left + 1);
    }
    
    return maxLength;
}

module.exports = { lengthOfLongestSubstring };"""
        else:
            # Generic template
            return f"""function solve() {{
    // TODO: Implement solution for {title}
    // Difficulty: {difficulty}
    return null;
}}

module.exports = {{ solve }};"""

    def scrape_problem(self, problem_data: Dict) -> Optional[LeetCodeProblem]:
        """Scrape a single problem with all its details"""
        try:
            problem_id = problem_data.get('frontendQuestionId', 0)
            title = problem_data.get('title', '')
            slug = problem_data.get('titleSlug', '')
            difficulty = problem_data.get('difficulty', 'Easy')
            acceptance_rate = problem_data.get('acRate', 0.0) * 100
            
            if not slug:
                return None
            
            print(f"Scraping problem {problem_id}: {title}")
            
            # Get problem content
            content_data = self.get_problem_content(slug)
            if not content_data:
                return None
            
            content = content_data.get('content', '')
            description, examples = self.parse_problem_content(content)
            
            # Generate solution template
            top_solution = self.generate_solution_template(title, difficulty)
            
            # Determine category from tags
            category = 'general'
            topic_tags = problem_data.get('topicTags', [])
            if topic_tags:
                primary_tag = topic_tags[0]['name']
                category = self.category_mapping.get(primary_tag, 'general')
            
            problem = LeetCodeProblem(
                id=problem_id,
                title=title,
                slug=slug,
                difficulty=difficulty,
                category=category,
                description=description,
                examples=examples,
                top_solution=top_solution,
                acceptance_rate=acceptance_rate,
                likes=0,  # Not available in this API
                dislikes=0  # Not available in this API
            )
            
            # Add delay to be respectful
            time.sleep(1)
            
            return problem
            
        except Exception as e:
            print(f"Error scraping problem {problem_data}: {e}")
            return None

    def scrape_problems(self, limit: int = 20) -> List[LeetCodeProblem]:
        """Scrape multiple problems"""
        problems = []
        problems_data = self.get_problems_list(limit)
        
        if not problems_data:
            print("No problems data received")
            return problems
        
        print(f"Found {len(problems_data)} problems. Scraping...")
        
        for i, problem_data in enumerate(problems_data):
            if i >= limit:
                break
                
            problem = self.scrape_problem(problem_data)
            if problem:
                problems.append(problem)
                print(f"Successfully scraped: {problem.title}")
            else:
                print(f"Failed to scrape problem {i+1}")
        
        return problems

    def save_problems(self, problems: List[LeetCodeProblem], output_dir: str = "scraped_problems"):
        """Save problems organized by category and difficulty"""
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Organize by category
        by_category = {}
        for problem in problems:
            if problem.category not in by_category:
                by_category[problem.category] = []
            by_category[problem.category].append(problem)
        
        # Save each category
        for category, category_problems in by_category.items():
            # Organize by difficulty within category
            by_difficulty = {'Easy': [], 'Medium': [], 'Hard': []}
            for problem in category_problems:
                by_difficulty[problem.difficulty].append(problem)
            
            # Save category file
            category_file = os.path.join(output_dir, f"{category}.json")
            with open(category_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'category': category,
                    'problems': [asdict(p) for p in category_problems]
                }, f, indent=2, ensure_ascii=False)
            
            # Save individual difficulty files
            for difficulty, difficulty_problems in by_difficulty.items():
                if difficulty_problems:
                    difficulty_file = os.path.join(output_dir, f"{category}_{difficulty.lower()}.json")
                    with open(difficulty_file, 'w', encoding='utf-8') as f:
                        json.dump({
                            'category': category,
                            'difficulty': difficulty,
                            'problems': [asdict(p) for p in difficulty_problems]
                        }, f, indent=2, ensure_ascii=False)
        
        # Save summary
        summary = {
            'total_problems': len(problems),
            'categories': {cat: len(probs) for cat, probs in by_category.items()},
            'difficulties': {
                'Easy': len([p for p in problems if p.difficulty == 'Easy']),
                'Medium': len([p for p in problems if p.difficulty == 'Medium']),
                'Hard': len([p for p in problems if p.difficulty == 'Hard'])
            }
        }
        
        with open(os.path.join(output_dir, 'summary.json'), 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"Saved {len(problems)} problems to {output_dir}/")
        print(f"Categories: {list(by_category.keys())}")
        print(f"Summary: {summary}")

    def generate_typescript_file(self, problems: List[LeetCodeProblem], output_file: str = "frontend/src/assets/leetcodeProblems.ts"):
        """Generate TypeScript file with problems for frontend"""
        ts_content = """export interface LeetCodeProblem {
    id: number;
    title: string;
    slug: string;
    difficulty: string;
    category: string;
    description: string;
    examples: Array<{input: string; output: string}>;
    top_solution: string;
    acceptance_rate: number;
    likes: number;
    dislikes: number;
}

export const LEETCODE_PROBLEMS: Record<string, LeetCodeProblem> = {
"""
        
        for problem in problems:
            key = f"{problem.difficulty.lower()}_{problem.slug.replace('-', '_')}"
            ts_content += f"""    {key}: {{
        id: {problem.id},
        title: "{problem.title}",
        slug: "{problem.slug}",
        difficulty: "{problem.difficulty}",
        category: "{problem.category}",
        description: `{problem.description.replace('`', '\\`')}`,
        examples: {json.dumps(problem.examples, ensure_ascii=False)},
        top_solution: `{problem.top_solution.replace('`', '\\`')}`,
        acceptance_rate: {problem.acceptance_rate},
        likes: {problem.likes},
        dislikes: {problem.dislikes}
    }},
"""
        
        ts_content += """};

export const getProblemsByCategory = () => {
    const problems = Object.values(LEETCODE_PROBLEMS);
    const categories: Record<string, LeetCodeProblem[]> = {};
    
    problems.forEach(problem => {
        if (!categories[problem.category]) {
            categories[problem.category] = [];
        }
        categories[problem.category].push(problem);
    });
    
    return categories;
};

export const getProblemsByDifficulty = () => {
    const problems = Object.values(LEETCODE_PROBLEMS);
    return {
        Easy: problems.filter(p => p.difficulty === 'Easy'),
        Medium: problems.filter(p => p.difficulty === 'Medium'),
        Hard: problems.filter(p => p.difficulty === 'Hard')
    };
};

export const getProblemBySlug = (slug: string): LeetCodeProblem | undefined => {
    return Object.values(LEETCODE_PROBLEMS).find(p => p.slug === slug);
};

export const getDefaultCodeForLanguage = (problemKey: string): string => {
    const problem = LEETCODE_PROBLEMS[problemKey];
    return problem ? problem.top_solution : Object.values(LEETCODE_PROBLEMS)[0]?.top_solution || "";
};

export const getSupportedProblems = (): string[] => {
    return Object.keys(LEETCODE_PROBLEMS);
};

export const getProblemDescription = (problemKey: string): string => {
    const problem = LEETCODE_PROBLEMS[problemKey];
    return problem ? problem.description : "Problem not found";
};
"""
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(ts_content)
        
        print(f"Generated TypeScript file: {output_file}")

def main():
    scraper = WorkingLeetCodeScraper()
    
    print("Starting Working LeetCode scraper...")
    print("This will actually scrape problems from LeetCode's website using only Python standard library.")
    print("Please be patient as this may take several minutes...")
    
    # Scrape problems (limit to 15 for initial run)
    problems = scraper.scrape_problems(limit=15)
    
    if problems:
        # Save to JSON files
        scraper.save_problems(problems)
        
        # Generate TypeScript file for frontend
        scraper.generate_typescript_file(problems)
        
        print(f"\nScraping completed successfully!")
        print(f"Total problems scraped: {len(problems)}")
        
        # Print summary
        categories = {}
        difficulties = {'Easy': 0, 'Medium': 0, 'Hard': 0}
        
        for problem in problems:
            if problem.category not in categories:
                categories[problem.category] = 0
            categories[problem.category] += 1
            difficulties[problem.difficulty] += 1
        
        print(f"\nProblems by category:")
        for cat, count in categories.items():
            print(f"  {cat}: {count}")
        
        print(f"\nProblems by difficulty:")
        for diff, count in difficulties.items():
            print(f"  {diff}: {count}")
    else:
        print("No problems were scraped. Please check your internet connection and try again.")

if __name__ == "__main__":
    main()
