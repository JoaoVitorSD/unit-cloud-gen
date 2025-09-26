export interface LeetCodeProblem {
    id: number;
    title: string;
    slug: string;
    difficulty: string;
    category: string;
    description: string;
    examples: Array<{ input: string; output: string }>;
    top_solution: string;
    acceptance_rate: number;
    likes: number;
    dislikes: number;
}

export const LEETCODE_PROBLEMS: Record<string, LeetCodeProblem> = {
    medium_integer_to_roman: {
        id: 12,
        title: "Integer to Roman",
        slug: "integer-to-roman",
        difficulty: "Medium",
        category: "hash-tables",
        description: `Seven different symbols represent Roman numerals with the following values: Symbol Value I 1 V 5 X 10 L 50 C 100 D 500 M 1000 Roman numerals are formed by appending&nbsp;the conversions of&nbsp;decimal place values&nbsp;from highest to lowest. Converting a decimal place value into a Roman numeral has the following rules: If the value does not start with 4 or&nbsp;9, select the symbol of the maximal value that can be subtracted from the input, append that symbol to the result, subtract its value, and convert the remainder to a Roman numeral. If the value starts with 4 or 9 use the&nbsp;subtractive form&nbsp;representing&nbsp;one symbol subtracted from the following symbol, for example,&nbsp;4 is 1 (I) less than 5 (V): IV&nbsp;and 9 is 1 (I) less than 10 (X): IX.&nbsp;Only the following subtractive forms are used: 4 (IV), 9 (IX),&nbsp;40 (XL), 90 (XC), 400 (CD) and 900 (CM). Only powers of 10 (I, X, C, M) can be appended consecutively at most 3 times to represent multiples of 10. You cannot append 5&nbsp;(V), 50 (L), or 500 (D) multiple times. If you need to append a symbol&nbsp;4 times&nbsp;use the subtractive form. Given an integer, convert it to a Roman numeral. &nbsp;`,
        examples: [{ "input": "num = 3749", "output": "&quot;MMMDCCXLIX&quot;" }, { "input": "num = 58", "output": "&quot;LVIII&quot;" }, { "input": "num = 1994", "output": "&quot;MCMXCIV&quot;" }],
        top_solution: `function intToRoman(num) {
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

module.exports = { intToRoman };`,
        acceptance_rate: 6945.2904530977985,
        likes: 0,
        dislikes: 0
    },
    easy_roman_to_integer: {
        id: 13,
        title: "Roman to Integer",
        slug: "roman-to-integer",
        difficulty: "Easy",
        category: "hash-tables",
        description: `Roman numerals are represented by seven different symbols:&nbsp;I, V, X, L, C, D and M. Symbol Value I 1 V 5 X 10 L 50 C 100 D 500 M 1000 For example,&nbsp;2 is written as II&nbsp;in Roman numeral, just two ones added together. 12 is written as&nbsp;XII, which is simply X + II. The number 27 is written as XXVII, which is XX + V + II. Roman numerals are usually written largest to smallest from left to right. However, the numeral for four is not IIII. Instead, the number four is written as IV. Because the one is before the five we subtract it making four. The same principle applies to the number nine, which is written as IX. There are six instances where subtraction is used: I can be placed before V (5) and X (10) to make 4 and 9.&nbsp; X can be placed before L (50) and C (100) to make 40 and 90.&nbsp; C can be placed before D (500) and M (1000) to make 400 and 900. Given a roman numeral, convert it to an integer. &nbsp;`,
        examples: [{ "input": "s = &quot;III&quot;", "output": "3" }, { "input": "s = &quot;LVIII&quot;", "output": "58" }, { "input": "s = &quot;MCMXCIV&quot;", "output": "1994" }],
        top_solution: `function romanToInt(s) {
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

module.exports = { romanToInt };`,
        acceptance_rate: 6551.579626371113,
        likes: 0,
        dislikes: 0
    },
    easy_palindrome_number: {
        id: 9,
        title: "Palindrome Number",
        slug: "palindrome-number",
        difficulty: "Easy",
        category: "math",
        description: `Given an integer x, return true if x is a palindrome, and false otherwise. &nbsp;`,
        examples: [{ "input": "x = 121", "output": "true" }, { "input": "x = -121", "output": "false" }, { "input": "x = 10", "output": "false" }],
        top_solution: `function isPalindrome(x) {
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

module.exports = { isPalindrome };`,
        acceptance_rate: 5969.251250588682,
        likes: 0,
        dislikes: 0
    },
    medium_container_with_most_water: {
        id: 11,
        title: "Container With Most Water",
        slug: "container-with-most-water",
        difficulty: "Medium",
        category: "arrays",
        description: `You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store. Notice that you may not slant the container. &nbsp;`,
        examples: [{ "input": "height = [1,8,6,2,5,4,8,3,7]", "output": "49" }, { "input": "height = [1,1]", "output": "1" }],
        top_solution: `function maxArea(height) {
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

module.exports = { maxArea };`,
        acceptance_rate: 5836.338604322683,
        likes: 0,
        dislikes: 0
    },
    easy_two_sum: {
        id: 1,
        title: "Two Sum",
        slug: "two-sum",
        difficulty: "Easy",
        category: "arrays",
        description: `Given an array of integers nums&nbsp;and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order. &nbsp;`,
        examples: [{ "input": "nums = [2,7,11,15], target = 9", "output": "[0,1]" }, { "input": "nums = [3,2,4], target = 6", "output": "[1,2]" }, { "input": "nums = [3,3], target = 6", "output": "[0,1]" }],
        top_solution: `function twoSum(nums, target) {
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

module.exports = { twoSum };`,
        acceptance_rate: 5634.23315238428,
        likes: 0,
        dislikes: 0
    },
    medium_zigzag_conversion: {
        id: 6,
        title: "Zigzag Conversion",
        slug: "zigzag-conversion",
        difficulty: "Medium",
        category: "strings",
        description: `The string &quot;PAYPALISHIRING&quot; is written in a zigzag pattern on a given number of rows like this: (you may want to display this pattern in a fixed font for better legibility) P A H N A P L S I I G Y I R And then read line by line: &quot;PAHNAPLSIIGYIR&quot; Write the code that will take a string and make this conversion given a number of rows: string convert(string s, int numRows); &nbsp;`,
        examples: [{ "input": "s = &quot;PAYPALISHIRING&quot;, numRows = 3", "output": "&quot;PAHNAPLSIIGYIR&quot;" }, { "input": "s = &quot;PAYPALISHIRING&quot;, numRows = 4", "output": "&quot;PINALSIGYAHRPI&quot;" }, { "input": "s = &quot;A&quot;, numRows = 1", "output": "&quot;A&quot;" }],
        top_solution: `function convert(s, numRows) {
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

module.exports = { convert };`,
        acceptance_rate: 5241.613744301832,
        likes: 0,
        dislikes: 0
    },
    medium_add_two_numbers: {
        id: 2,
        title: "Add Two Numbers",
        slug: "add-two-numbers",
        difficulty: "Medium",
        category: "linked-lists",
        description: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum&nbsp;as a linked list. You may assume the two numbers do not contain any leading zero, except the number 0 itself. &nbsp;`,
        examples: [{ "input": "l1 = [2,4,3], l2 = [5,6,4]", "output": "[7,0,8]" }, { "input": "l1 = [0], l2 = [0]", "output": "[0]" }, { "input": "l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]", "output": "[8,9,9,9,0,0,0,1]" }],
        top_solution: `function addTwoNumbers(l1, l2) {
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

module.exports = { addTwoNumbers };`,
        acceptance_rate: 4699.818611316941,
        likes: 0,
        dislikes: 0
    },
    easy_longest_common_prefix: {
        id: 14,
        title: "Longest Common Prefix",
        slug: "longest-common-prefix",
        difficulty: "Easy",
        category: "arrays",
        description: `Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string &quot;&quot;. &nbsp;`,
        examples: [{ "input": "strs = [&quot;flower&quot;,&quot;flow&quot;,&quot;flight&quot;]", "output": "&quot;fl&quot;" }, { "input": "strs = [&quot;dog&quot;,&quot;racecar&quot;,&quot;car&quot;]", "output": "&quot;&quot;" }],
        top_solution: `function longestCommonPrefix(strs) {
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

module.exports = { longestCommonPrefix };`,
        acceptance_rate: 4622.647349255396,
        likes: 0,
        dislikes: 0
    },
    hard_median_of_two_sorted_arrays: {
        id: 4,
        title: "Median of Two Sorted Arrays",
        slug: "median-of-two-sorted-arrays",
        difficulty: "Hard",
        category: "arrays",
        description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)). &nbsp;`,
        examples: [{ "input": "nums1 = [1,3], nums2 = [2]", "output": "2.00000" }, { "input": "nums1 = [1,2], nums2 = [3,4]", "output": "2.50000" }],
        top_solution: `function findMedianSortedArrays(nums1, nums2) {
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

module.exports = { findMedianSortedArrays };`,
        acceptance_rate: 4479.244224569235,
        likes: 0,
        dislikes: 0
    },
    medium_3sum: {
        id: 15,
        title: "3Sum",
        slug: "3sum",
        difficulty: "Medium",
        category: "arrays",
        description: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets. &nbsp;`,
        examples: [{ "input": "nums = [-1,0,1,2,-1,-4]", "output": "[[-1,-1,2],[-1,0,1]]" }, { "input": "nums = [0,1,1]", "output": "[]" }, { "input": "nums = [0,0,0]", "output": "[[0,0,0]]" }],
        top_solution: `function threeSum(nums) {
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

module.exports = { threeSum };`,
        acceptance_rate: 3774.890352695148,
        likes: 0,
        dislikes: 0
    },
    medium_longest_substring_without_repeating_characters: {
        id: 3,
        title: "Longest Substring Without Repeating Characters",
        slug: "longest-substring-without-repeating-characters",
        difficulty: "Medium",
        category: "hash-tables",
        description: `Given a string s, find the length of the longest substring without duplicate characters. &nbsp;`,
        examples: [{ "input": "s = &quot;abcabcbb&quot;", "output": "3" }, { "input": "s = &quot;bbbbb&quot;", "output": "1" }, { "input": "s = &quot;pwwkew&quot;", "output": "3" }],
        top_solution: `function lengthOfLongestSubstring(s) {
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

module.exports = { lengthOfLongestSubstring };`,
        acceptance_rate: 3762.0353648132955,
        likes: 0,
        dislikes: 0
    },
    medium_longest_palindromic_substring: {
        id: 5,
        title: "Longest Palindromic Substring",
        slug: "longest-palindromic-substring",
        difficulty: "Medium",
        category: "two-pointers",
        description: `Given a string s, return the longest palindromic substring in s. &nbsp;`,
        examples: [{ "input": "s = &quot;babad&quot;", "output": "&quot;bab&quot;" }, { "input": "s = &quot;cbbd&quot;", "output": "&quot;bb&quot;" }],
        top_solution: `function longestPalindrome(s) {
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

module.exports = { longestPalindrome };`,
        acceptance_rate: 3647.64300706402,
        likes: 0,
        dislikes: 0
    },
    medium_reverse_integer: {
        id: 7,
        title: "Reverse Integer",
        slug: "reverse-integer",
        difficulty: "Medium",
        category: "math",
        description: `Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-231, 231 - 1], then return 0. Assume the environment does not allow you to store 64-bit integers (signed or unsigned). &nbsp;`,
        examples: [{ "input": "x = 123", "output": "321" }, { "input": "x = -123", "output": "-321" }, { "input": "x = 120", "output": "21" }],
        top_solution: `cpp // pop operation: pop = x % 10; x /= 10; // push operation: temp = rev * 10 + pop; rev = temp;

module.exports = { solution };`,
        acceptance_rate: 3082.788108971376,
        likes: 0,
        dislikes: 0
    },
    hard_regular_expression_matching: {
        id: 10,
        title: "Regular Expression Matching",
        slug: "regular-expression-matching",
        difficulty: "Hard",
        category: "strings",
        description: `Given an input string s&nbsp;and a pattern p, implement regular expression matching with support for &#39;.&#39; and &#39;*&#39; where: &#39;.&#39; Matches any single character​​​39;*&#39; Matches zero or more of the preceding element. The matching should cover the entire input string (not partial). &nbsp;`,
        examples: [{ "input": "s = &quot;aa&quot;, p = &quot;a&quot;", "output": "false" }, { "input": "s = &quot;aa&quot;, p = &quot;a*&quot;", "output": "true" }, { "input": "s = &quot;ab&quot;, p = &quot;.*&quot;", "output": "true" }],
        top_solution: `function isMatch(s, p) {
    const memo = new Map();
    
    function dp(i, j) {
       
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
        return result;
    }
    
    return dp(0, 0);
}

module.exports = { isMatch };`,
        acceptance_rate: 2968.4587266573362,
        likes: 0,
        dislikes: 0
    },
    medium_string_to_integer_atoi: {
        id: 8,
        title: "String to Integer (atoi)",
        slug: "string-to-integer-atoi",
        difficulty: "Medium",
        category: "strings",
        description: `Implement the myAtoi(string s) function, which converts a string to a 32-bit signed integer. The algorithm for myAtoi(string s) is as follows: Whitespace: Ignore any leading whitespace (&quot; &quot;). Signedness: Determine the sign by checking if the next character is &#39;-&#39; or &#39;+&#39;, assuming positivity if neither present. Conversion: Read the integer by skipping leading zeros&nbsp;until a non-digit character is encountered or the end of the string is reached. If no digits were read, then the result is 0. Rounding: If the integer is out of the 32-bit signed integer range [-231, 231 - 1], then round the integer to remain in the range. Specifically, integers less than -231 should be rounded to -231, and integers greater than 231 - 1 should be rounded to 231 - 1. Return the integer as the final result. &nbsp;`,
        examples: [{ "input": "s = &quot;42&quot;", "output": "42" }, { "input": "s = &quot; -042&quot;", "output": "-42" }, { "input": "s = &quot;1337c0d3&quot;", "output": "1337" }, { "input": "s = &quot;0-1&quot;", "output": "0" }, { "input": "s = &quot;words and 987&quot;", "output": "0" }],
        top_solution: `function myAtoi(s) {
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

module.exports = { myAtoi };`,
        acceptance_rate: 1982.5194273372945,
        likes: 0,
        dislikes: 0
    },
};

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
