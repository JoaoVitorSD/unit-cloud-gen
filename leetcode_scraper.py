#!/usr/bin/env python3
"""
Working LeetCode Problem Scraper
Uses only Python standard library to scrape real problems from LeetCode.
"""

import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
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
    def __init__(self, session_id: str = None, csrf_token: str = None):
        self.base_url = "https://leetcode.com"
        self.session_id = session_id
        self.csrf_token = csrf_token

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

    def make_request(
        self, url: str, data: Dict = None, headers: Dict = None
    ) -> Optional[Dict]:
        """Make HTTP request using urllib with authentication"""
        try:
            # Prepare headers with authentication
            request_headers = headers or {}
            if self.session_id:
                request_headers["Cookie"] = f"LEETCODE_SESSION={self.session_id}"
            if self.csrf_token:
                request_headers["X-CSRFToken"] = self.csrf_token
                request_headers["Referer"] = "https://leetcode.com"

            if data:
                data_bytes = json.dumps(data).encode("utf-8")
                req = urllib.request.Request(
                    url, data=data_bytes, headers=request_headers
                )
            else:
                req = urllib.request.Request(url, headers=request_headers)

            with urllib.request.urlopen(req) as response:
                response_data = response.read().decode("utf-8")
                print(f"Response status: {response.status}")
                print(f"Response headers: {dict(response.headers)}")
                print(f"Response content: {response_data[:500]}...")
                return json.loads(response_data)
        except urllib.error.HTTPError as e:
            print(f"HTTP Error {e.code}: {e.reason}")
            try:
                error_content = e.read().decode("utf-8")
                print(f"Error response: {error_content[:500]}...")
            except:
                print("Could not read error response")
            return None
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

        variables = {"categorySlug": "", "skip": 0, "limit": limit, "filters": {}}

        payload = {"query": query, "variables": variables}

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Referer": "https://leetcode.com/problemset/all/",
        }

        result = self.make_request(f"{self.base_url}/graphql/", payload, headers)

        if result:
            questions = (
                result.get("data", {})
                .get("problemsetQuestionList", {})
                .get("questions", [])
            )
            # Filter out paid problems and sort by acceptance rate
            free_questions = [q for q in questions if not q.get("paidOnly", False)]
            free_questions.sort(key=lambda x: x.get("acRate", 0), reverse=True)
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
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
        }

        result = self.make_request(f"{self.base_url}/graphql/", payload, headers)

        if result:
            return result.get("data", {}).get("question", {})

        return None

    def parse_problem_content(self, content: str) -> Tuple[str, List[Dict[str, str]]]:
        """Parse problem content to extract description and examples"""
        if not content:
            return "", []

        # Simple HTML tag removal
        content = re.sub(r"<[^>]+>", "", content)

        # Extract examples using regex
        examples = []
        example_pattern = r"Example \d+:\s*Input:\s*([^\n]+)\s*Output:\s*([^\n]+)"
        matches = re.findall(example_pattern, content, re.IGNORECASE | re.DOTALL)

        for match in matches:
            input_example = match[0].strip()
            output_example = match[1].strip()
            # Clean up the examples
            input_example = re.sub(r"\s+", " ", input_example)
            output_example = re.sub(r"\s+", " ", output_example)
            examples.append({"input": input_example, "output": output_example})

        # Get description (everything before examples)
        description = content
        if examples:
            # Find the first example and cut description there
            first_example_pos = content.find("Example 1:")
            if first_example_pos != -1:
                description = content[:first_example_pos].strip()

        # Clean up description
        description = re.sub(r"\s+", " ", description)
        description = description.replace("\n", " ").strip()

        return description, examples

    def get_solution_from_leetcode(self, slug: str) -> Optional[str]:
        """Get actual solution from LeetCode's solutions API"""
        try:
            # Try to get solutions using GraphQL
            query = """
            query questionSolutions($titleSlug: String!) {
                question(titleSlug: $titleSlug) {
                    solution {
                        id
                        content
                        contentTypeId
                        canSeeDetail
                        paidOnly
                        hasVideoSolution
                        paidOnlyVideo
                    }
                }
            }
            """

            variables = {"titleSlug": slug}
            payload = {"query": query, "variables": variables}

            headers = {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
            }

            print(f"Making solution request for slug: {slug}")
            print(f"Query: {query[:200]}...")
            print(f"Variables: {variables}")

            result = self.make_request(f"{self.base_url}/graphql/", payload, headers)

            if result:
                print(f"Solution API response: {result}")
                solution_data = (
                    result.get("data", {}).get("question", {}).get("solution")
                )
                if solution_data and not solution_data.get("paidOnly", True):
                    content = solution_data.get("content", "")
                    if content:
                        # Extract JavaScript code from the solution content
                        return self.extract_javascript_from_solution(content)
                else:
                    print(f"No solution data or paid only: {solution_data}")

            return None

        except Exception as e:
            print(f"Error fetching solution for {slug}: {e}")
            return None

    def extract_javascript_from_solution(self, content: str) -> str:
        """Extract JavaScript code from solution content"""
        try:
            # Look for JavaScript code blocks
            import re

            # Try to find code blocks with JavaScript
            js_patterns = [
                r"```javascript\s*(.*?)\s*```",
                r"```js\s*(.*?)\s*```",
                r"```\s*(.*?)\s*```",  # Generic code block
            ]

            for pattern in js_patterns:
                matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
                if matches:
                    code = matches[0].strip()
                    # Clean up the code
                    code = re.sub(r"<[^>]+>", "", code)  # Remove HTML tags
                    code = re.sub(r"\s+", " ", code)  # Normalize whitespace

                    # Ensure it has proper module.exports
                    if "module.exports" not in code:
                        # Try to extract function name and add module.exports
                        func_match = re.search(r"function\s+(\w+)", code)
                        if func_match:
                            func_name = func_match.group(1)
                            code += f"\n\nmodule.exports = {{ {func_name} }};"
                        else:
                            code += "\n\nmodule.exports = { solution };"

                    return code

            # If no code blocks found, try to extract from HTML content
            # Look for <code> tags or other code indicators
            code_patterns = [
                r"<code[^>]*>(.*?)</code>",
                r"<pre[^>]*>(.*?)</pre>",
            ]

            for pattern in code_patterns:
                matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)
                if matches:
                    code = matches[0].strip()
                    # Clean up HTML entities and tags
                    code = re.sub(r"&lt;", "<", code)
                    code = re.sub(r"&gt;", ">", code)
                    code = re.sub(r"&amp;", "&", code)
                    code = re.sub(r"<[^>]+>", "", code)

                    if "function" in code and ("(" in code or "{" in code):
                        if "module.exports" not in code:
                            func_match = re.search(r"function\s+(\w+)", code)
                            if func_match:
                                func_name = func_match.group(1)
                                code += f"\n\nmodule.exports = {{ {func_name} }};"
                            else:
                                code += "\n\nmodule.exports = { solution };"
                        return code

            return None

        except Exception as e:
            print(f"Error extracting JavaScript from solution: {e}")
            return None

    def generate_solution_template(
        self, title: str, difficulty: str, description: str = "", slug: str = ""
    ) -> str:
        """Get actual solution from LeetCode or fallback to template"""
        # First try to get real solution from LeetCode
        if slug:
            real_solution = self.get_solution_from_leetcode(slug)
            if real_solution:
                print(f"Found real solution for {title}")
                return real_solution

        # Fallback to comprehensive solution templates
        print(f"Using template solution for {title}")

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
        elif "Container With Most Water" in title:
            return """function maxArea(height) {
    let left = 0;
    let right = height.length - 1;
    let maxWater = 0;
    
    while (left < right) {
        const width = right - left;
        const minHeight = Math.min(height[left], height[right]);
        const currentArea = width * minHeight;
        maxWater = Math.max(maxWater, currentArea);
        
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    
    return maxWater;
}

module.exports = { maxArea };"""
        elif "Palindrome Number" in title:
            return """function isPalindrome(x) {
    if (x < 0) return false;
    if (x < 10) return true;
    
    let original = x;
    let reversed = 0;
    
    while (x > 0) {
        reversed = reversed * 10 + x % 10;
        x = Math.floor(x / 10);
    }
    
    return original === reversed;
}

module.exports = { isPalindrome };"""
        elif "Roman to Integer" in title:
            return """function romanToInt(s) {
    const romanMap = {
        'I': 1, 'V': 5, 'X': 10, 'L': 50,
        'C': 100, 'D': 500, 'M': 1000
    };
    
    let result = 0;
    
    for (let i = 0; i < s.length; i++) {
        const current = romanMap[s[i]];
        const next = romanMap[s[i + 1]];
        
        if (next && current < next) {
            result -= current;
        } else {
            result += current;
        }
    }
    
    return result;
}

module.exports = { romanToInt };"""
        elif "Integer to Roman" in title:
            return """function intToRoman(num) {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    
    let result = '';
    
    for (let i = 0; i < values.length; i++) {
        while (num >= values[i]) {
            result += symbols[i];
            num -= values[i];
        }
    }
    
    return result;
}

module.exports = { intToRoman };"""
        elif "3Sum" in title:
            return """function threeSum(nums) {
    nums.sort((a, b) => a - b);
    const result = [];
    
    for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        
        let left = i + 1;
        let right = nums.length - 1;
        
        while (left < right) {
            const sum = nums[i] + nums[left] + nums[right];
            
            if (sum === 0) {
                result.push([nums[i], nums[left], nums[right]]);
                
                while (left < right && nums[left] === nums[left + 1]) left++;
                while (left < right && nums[right] === nums[right - 1]) right--;
                
                left++;
                right--;
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    
    return result;
}

module.exports = { threeSum };"""
        elif "Longest Palindromic Substring" in title:
            return """function longestPalindrome(s) {
    if (!s || s.length < 1) return '';
    
    let start = 0;
    let end = 0;
    
    for (let i = 0; i < s.length; i++) {
        const len1 = expandAroundCenter(s, i, i);
        const len2 = expandAroundCenter(s, i, i + 1);
        const len = Math.max(len1, len2);
        
        if (len > end - start) {
            start = i - Math.floor((len - 1) / 2);
            end = i + Math.floor(len / 2);
        }
    }
    
    return s.substring(start, end + 1);
}

function expandAroundCenter(s, left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
        left--;
        right++;
    }
    return right - left - 1;
}

module.exports = { longestPalindrome };"""
        elif "Reverse Integer" in title:
            return """function reverse(x) {
    const isNegative = x < 0;
    x = Math.abs(x);
    
    let result = 0;
    
    while (x > 0) {
        result = result * 10 + x % 10;
        x = Math.floor(x / 10);
    }
    
    if (isNegative) result = -result;
    
    // Check for 32-bit integer overflow
    if (result > 2147483647 || result < -2147483648) {
        return 0;
    }
    
    return result;
}

module.exports = { reverse };"""
        elif "String to Integer" in title or "atoi" in title:
            return """function myAtoi(s) {
    s = s.trim();
    if (!s) return 0;
    
    let sign = 1;
    let i = 0;
    
    if (s[0] === '+' || s[0] === '-') {
        sign = s[0] === '-' ? -1 : 1;
        i = 1;
    }
    
    let result = 0;
    
    while (i < s.length && s[i] >= '0' && s[i] <= '9') {
        result = result * 10 + (s[i] - '0');
        i++;
    }
    
    result *= sign;
    
    // Clamp to 32-bit integer range
    if (result > 2147483647) return 2147483647;
    if (result < -2147483648) return -2147483648;
    
    return result;
}

module.exports = { myAtoi };"""
        elif "Regular Expression Matching" in title:
            return """function isMatch(s, p) {
    const memo = new Map();
    
    function dp(i, j) {
        if (memo.has(`${i},${j}`)) {
            return memo.get(`${i},${j}`);
        }
        
        if (j === p.length) {
            return i === s.length;
        }
        
        const firstMatch = i < s.length && (p[j] === s[i] || p[j] === '.');
        
        let result;
        if (j + 1 < p.length && p[j + 1] === '*') {
            result = dp(i, j + 2) || (firstMatch && dp(i + 1, j));
        } else {
            result = firstMatch && dp(i + 1, j + 1);
        }
        
        memo.set(`${i},${j}`, result);
        return result;
    }
    
    return dp(0, 0);
}

module.exports = { isMatch };"""
        elif "Zigzag Conversion" in title:
            return """function convert(s, numRows) {
    if (numRows === 1) return s;
    
    const rows = new Array(numRows).fill('');
    let currentRow = 0;
    let goingDown = false;
    
    for (const char of s) {
        rows[currentRow] += char;
        
        if (currentRow === 0 || currentRow === numRows - 1) {
            goingDown = !goingDown;
        }
        
        currentRow += goingDown ? 1 : -1;
    }
    
    return rows.join('');
}

module.exports = { convert };"""
        elif "Longest Common Prefix" in title:
            return """function longestCommonPrefix(strs) {
    if (!strs || strs.length === 0) return '';
    
    let prefix = strs[0];
    
    for (let i = 1; i < strs.length; i++) {
        while (strs[i].indexOf(prefix) !== 0) {
            prefix = prefix.substring(0, prefix.length - 1);
            if (prefix === '') return '';
        }
    }
    
    return prefix;
}

module.exports = { longestCommonPrefix };"""
        elif "Median of Two Sorted Arrays" in title:
            return """function findMedianSortedArrays(nums1, nums2) {
    if (nums1.length > nums2.length) {
        [nums1, nums2] = [nums2, nums1];
    }
    
    const m = nums1.length;
    const n = nums2.length;
    let left = 0;
    let right = m;
    
    while (left <= right) {
        const partitionX = Math.floor((left + right) / 2);
        const partitionY = Math.floor((m + n + 1) / 2) - partitionX;
        
        const maxLeftX = partitionX === 0 ? -Infinity : nums1[partitionX - 1];
        const minRightX = partitionX === m ? Infinity : nums1[partitionX];
        
        const maxLeftY = partitionY === 0 ? -Infinity : nums2[partitionY - 1];
        const minRightY = partitionY === n ? Infinity : nums2[partitionY];
        
        if (maxLeftX <= minRightY && maxLeftY <= minRightX) {
            if ((m + n) % 2 === 0) {
                return (Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2;
            } else {
                return Math.max(maxLeftX, maxLeftY);
            }
        } else if (maxLeftX > minRightY) {
            right = partitionX - 1;
        } else {
            left = partitionX + 1;
        }
    }
    
    return 0;
}

module.exports = { findMedianSortedArrays };"""
        else:
            # Generate a more intelligent template based on the problem description
            import re

            function_name = re.sub(r"[^a-z0-9]", "", title.lower().replace(" ", ""))
            if not function_name:
                function_name = "solve"

            return f"""function {function_name}() {{
    // TODO: Implement solution for {title}
    // Difficulty: {difficulty}
    // Description: {description[:100]}...
    return null;
}}

module.exports = {{ {function_name} }};"""

    def scrape_problem(self, problem_data: Dict) -> Optional[LeetCodeProblem]:
        """Scrape a single problem with all its details"""
        try:
            problem_id = problem_data.get("frontendQuestionId", 0)
            title = problem_data.get("title", "")
            slug = problem_data.get("titleSlug", "")
            difficulty = problem_data.get("difficulty", "Easy")
            acceptance_rate = problem_data.get("acRate", 0.0) * 100

            if not slug:
                return None

            print(f"Scraping problem {problem_id}: {title}")

            # Get problem content
            content_data = self.get_problem_content(slug)
            if not content_data:
                return None

            content = content_data.get("content", "")
            description, examples = self.parse_problem_content(content)

            # Generate solution template
            top_solution = self.generate_solution_template(
                title, difficulty, description, slug
            )

            # Determine category from tags
            category = "general"
            topic_tags = problem_data.get("topicTags", [])
            if topic_tags:
                primary_tag = topic_tags[0]["name"]
                category = self.category_mapping.get(primary_tag, "general")

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
                dislikes=0,  # Not available in this API
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

    def save_problems(
        self, problems: List[LeetCodeProblem], output_dir: str = "scraped_problems"
    ):
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
            by_difficulty = {"Easy": [], "Medium": [], "Hard": []}
            for problem in category_problems:
                by_difficulty[problem.difficulty].append(problem)

            # Save category file
            category_file = os.path.join(output_dir, f"{category}.json")
            with open(category_file, "w", encoding="utf-8") as f:
                json.dump(
                    {
                        "category": category,
                        "problems": [asdict(p) for p in category_problems],
                    },
                    f,
                    indent=2,
                    ensure_ascii=False,
                )

            # Save individual difficulty files
            for difficulty, difficulty_problems in by_difficulty.items():
                if difficulty_problems:
                    difficulty_file = os.path.join(
                        output_dir, f"{category}_{difficulty.lower()}.json"
                    )
                    with open(difficulty_file, "w", encoding="utf-8") as f:
                        json.dump(
                            {
                                "category": category,
                                "difficulty": difficulty,
                                "problems": [asdict(p) for p in difficulty_problems],
                            },
                            f,
                            indent=2,
                            ensure_ascii=False,
                        )

        # Save summary
        summary = {
            "total_problems": len(problems),
            "categories": {cat: len(probs) for cat, probs in by_category.items()},
            "difficulties": {
                "Easy": len([p for p in problems if p.difficulty == "Easy"]),
                "Medium": len([p for p in problems if p.difficulty == "Medium"]),
                "Hard": len([p for p in problems if p.difficulty == "Hard"]),
            },
        }

        with open(os.path.join(output_dir, "summary.json"), "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)

        print(f"Saved {len(problems)} problems to {output_dir}/")
        print(f"Categories: {list(by_category.keys())}")
        print(f"Summary: {summary}")

    def generate_typescript_file(
        self,
        problems: List[LeetCodeProblem],
        output_file: str = "frontend/src/assets/leetcodeProblems.ts",
    ):
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

        with open(output_file, "w", encoding="utf-8") as f:
            f.write(ts_content)

        print(f"Generated TypeScript file: {output_file}")


def main():
    import json
    import sys

    # Check for authentication
    session_id = None
    csrf_token = None

    if "--auth" in sys.argv:
        try:
            with open("auth_tokens.json", "r") as f:
                auth_data = json.load(f)
                session_id = auth_data.get("session_id")
                print(session_id)
                csrf_token = auth_data.get("csrf_token")
                print(csrf_token)
                print("Using authentication tokens from auth_tokens.json")
        except FileNotFoundError:
            print("auth_tokens.json not found. Run get_auth_tokens.py first.")
            return
        except Exception as e:
            print(f"Error loading auth tokens: {e}")
            return

    scraper = WorkingLeetCodeScraper(session_id, csrf_token)

    print("Starting Working LeetCode scraper...")
    print(
        "This will actually scrape problems from LeetCode's website using only Python standard library."
    )
    if session_id and csrf_token:
        print("Using authentication - will try to fetch real solutions from LeetCode.")
    else:
        print("No authentication - will use comprehensive template solutions.")
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
        difficulties = {"Easy": 0, "Medium": 0, "Hard": 0}

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
        print(
            "No problems were scraped. Please check your internet connection and try again."
        )


if __name__ == "__main__":
    main()
