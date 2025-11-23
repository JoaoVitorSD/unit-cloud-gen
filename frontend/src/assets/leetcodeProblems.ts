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
    leetcode_link?: string;
    problem_type?: string;
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
        top_solution: `var intToRoman = function(num) {
    const valueSymbols = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let res = '';

    for (const [value, symbol] of valueSymbols) {
      if (num === 0) break;
      const count = Math.floor(num / value);
      res += symbol.repeat(count);
      num -= count * value;
    }

    return res;    
};

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
        description: `Given an integer x, return true if x is a palindrome, and false otherwise.
Example 1:

Input: x = 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.
Example 2:

Input: x = -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.
Example 3:

Input: x = 10
Output: false
Explanation: Reads 01 from right to left. Therefore it is not a palindrome.
 

Constraints:

-231 <= x <= 231 - 1
 `,
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
        description: `You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

Notice that you may not slant the container.

 

Example 1:


Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water (blue section) the container can contain is 49.
Example 2:

Input: height = [1,1]
Output: 1
 

Constraints:

n == height.length
2 <= n <= 105
0 <= height[i] <= 104`,
        examples: [{ "input": "height = [1,8,6,2,5,4,8,3,7]", "output": "49" }, { "input": "height = [1,1]", "output": "1" }],
        top_solution: `function maxArea(height) {
    let i = 0;
    let j = height.length - 1;
    let res = 0;

    while (i < j) {
        res = Math.max(res, (j - i) * Math.min(height[i], height[j]));
        if (height[i] < height[j]) i++;
        else j--;
    }

    return res;
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
        top_solution: `var findMedianSortedArrays = function(nums1, nums2) {
    if (nums1.length > nums2.length) {
        return findMedianSortedArrays(nums2, nums1);
    }

    const len1 = nums1.length;
    const len2 = nums2.length;
    let left = 0, right = len1;

    while (left <= right) {
        const part1 = Math.floor((left + right) / 2);
        const part2 = Math.floor((len1 + len2 + 1) / 2) - part1;

        const maxLeft1 = part1 === 0 ? -Infinity : nums1[part1 - 1];
        const minRight1 = part1 === len1 ? Infinity : nums1[part1];
        const maxLeft2 = part2 === 0 ? -Infinity : nums2[part2 - 1];
        const minRight2 = part2 === len2 ? Infinity : nums2[part2];

        if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
            if ((len1 + len2) % 2 === 0) {
                return (Math.max(maxLeft1, maxLeft2) + Math.min(minRight1, minRight2)) / 2;
            } else {
                return Math.max(maxLeft1, maxLeft2);
            }
        } else if (maxLeft1 > minRight2) {
            right = part1 - 1;
        } else {
            left = part1 + 1;
        }
    }    
};

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
        category: "DP",
        description: `Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*' where: '.' Matches any single character. '*' Matches zero or more of the preceding element. The matching should cover the entire input string (not partial).`,
        examples: [{ "input": "s = &quot;aa&quot;, p = &quot;a&quot;", "output": "false" }, { "input": "s = &quot;aa&quot;, p = &quot;a*&quot;", "output": "true" }, { "input": "s = &quot;ab&quot;, p = &quot;.*&quot;", "output": "true" }],
        top_solution: `var isMatch = function(s, p) {
    const m = s.length, n = p.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(false));
    dp[0][0] = true;

    for (let j = 1; j <= n; j++) {
        if (p[j - 1] === '*') {
            dp[0][j] = dp[0][j - 2];
        }
    }

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (p[j - 1] === '.' || p[j - 1] === s[i - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else if (p[j - 1] === '*') {
                dp[i][j] = dp[i][j - 2];
                if (p[j - 2] === '.' || p[j - 2] === s[i - 1]) {
                    dp[i][j] = dp[i][j] || dp[i - 1][j];
                }
            }
        }
    }

    return dp[m][n];
};

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
    hard_n_queens: {
        id: 51,
        title: "N-Queens",
        slug: "n-queens",
        difficulty: "Hard",
        category: "arrays",
        description: `The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other. Given an integer n, return all distinct solutions to the n-queens puzzle. You may return the answer in any order. Each solution contains a distinct board configuration of the n-queens' placement, where 'Q' and '.' both indicate a queen and an empty space, respectively.`,
        examples: [{ "input": "n = 4", "output": "[[&quot;.Q..&quot;,&quot;...Q&quot;,&quot;Q...&quot;,&quot;..Q.&quot;],[&quot;..Q.&quot;,&quot;Q...&quot;,&quot;...Q&quot;,&quot;.Q..&quot;]]" }, { "input": "n = 1", "output": "[[&quot;Q&quot;]]" }],
        top_solution: `var solveNQueens = function(n) {
    const res = [];
    const board = Array.from({ length: n }, () => Array(n).fill('.'));
    function backtrack(row) {
        if (row === n) {
            res.push(board.map(r => r.join("")));
            return;
        }
        for (let col = 0; col < n; col++) {
            if (isSafe(row, col)) {
                board[row][col] = 'Q';
                backtrack(row + 1);
                board[row][col] = '.';
            }
        }
    }
    function isSafe(row, col) {
        for (let i = 0; i < row; i++) {
            if (board[i][col] === 'Q') return false;
        }
        for (let i = 1; i <= Math.min(row, col); i++) {
            if (board[row - i][col - i] === 'Q') return false;
        }
        for (let i = 1; i <= Math.min(row, n - 1 - col); i++) {
            if (board[row - i][col + i] === 'Q') return false;
        }
        return true;
    }
    backtrack(0);
    return res;
};

module.exports = { solveNQueens };`,
        acceptance_rate: 1982.5194273372945,
        likes: 0,
        dislikes: 0
    },
    hard_best_time_to_buy_and_sell_stock_iii: {
        id: 123,
        title: "Best Time to Buy and Sell Stock III",
        slug: "best-time-to-buy-and-sell-stock-iii",
        difficulty: "Hard",
        category: "arrays",
        description: `You are given an array prices where prices[i] is the price of a given stock on the ith day. Find the maximum profit you can achieve. You may complete at most two transactions. Note: You may not engage in multiple transactions simultaneously (i.e., you must sell the stock before you buy again).`,
        examples: [{ "input": "prices = [3,3,5,0,0,3,1,4]", "output": "6" }, { "input": "prices = [1,2,3,4,5]", "output": "4" }, { "input": "prices = [7,6,4,3,1]", "output": "0" }],
        top_solution: `var maxProfit = function(prices) {
    let buy1 = -prices[0];
    let sell1 = 0;
    let buy2 = -prices[0];
    let sell2 = 0;
    for (let i = 1; i < prices.length; i++) {
        let price = prices[i];
        buy1 = Math.max(buy1, -price);
        sell1 = Math.max(sell1, buy1 + price);
        buy2 = Math.max(buy2, sell1 - price);
        sell2 = Math.max(sell2, buy2 + price);
    }
    return sell2;    
};

module.exports = { maxProfit };`,
        acceptance_rate: 4967.08,
        likes: 0,
        dislikes: 0
    },
    hard_max_points_on_a_line: {
        id: 149,
        title: "Max Points on a Line",
        slug: "max-points-on-a-line",
        difficulty: "Hard",
        category: "geometry",
        description: `Given an array of points where points[i] = [xi, yi] represents a point on the X-Y plane, return the maximum number of points that lie on the same straight line.`,
        examples: [{ "input": "points = [[1,1],[2,2],[3,3]]", "output": "3" }, { "input": "points = [[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]", "output": "4" }],
        top_solution: `var maxPoints = function(points) {
  let max = 0;
    for (const x of points) {
      const slopes = new Map();
    for (const y of points) {
      if (x === y) continue;
      let slope = Infinity;
      if (y[0] - x[0] !== 0) {
        slope = (y[1] - x[1]) / (y[0] - x[0]);
      }
      if (slopes.has(slope)) {
        slopes.set(slope, slopes.get(slope) + 1);
      } else {
        slopes.set(slope, 1);
      }
      max = Math.max(max, slopes.get(slope));
    }
  }
  return max + 1;
};

module.exports = { maxPoints };`,
        acceptance_rate: 496708,
        likes: 0,
        dislikes: 0
    },
    hard_count_of_smaller_numbers_after_self: {
        id: 315,
        title: "Count of Smaller Numbers After Self",
        slug: "count-of-smaller-numbers-after-self",
        difficulty: "Hard",
        category: "binary-search",
        description: `Given an integer array nums, return an integer array counts where counts[i] is the number of smaller elements to the right of nums[i].`,
        examples: [{ "input": "nums = [5,2,6,1]", "output": "[2,1,1,0]" }, { "input": "nums = [-1]", "output": "[0]" }, { "input": "nums = [-1,-1]", "output": "[0,0]" }],
        top_solution: `function countSmaller(nums) {
    const li = [];
    const sorted = [];
    for (let i = nums.length - 1; i >= 0; i--) {
        const index = insert(sorted, nums[i]);
        li.push(index);
        sorted.splice(index, 0, nums[i]);
    }
    return li.reverse();
}

function insert(arr, num) {
    let left = 0, right = arr.length - 1;
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (arr[mid] < num) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return left;
}

module.exports = { countSmaller };`,
        acceptance_rate: 4967.08,
        likes: 0,
        dislikes: 0
    },
    hard_find_maximum_non_decreasing_array_length: {
        id: 2945,
        title: "Find Maximum Non-Decreasing Array Length",
        slug: "find-maximum-non-decreasing-array-length",
        difficulty: "Hard",
        category: "binary-search",
        description: `You are given a 0-indexed integer array nums. You can perform any number of operations, where each operation involves selecting a subarray of the array and replacing it with the sum of its elements. For example, if the given array is [1,3,5,6] and you select subarray [3,5] the array will convert to [1,8,6]. Return the maximum length of a non-decreasing array that can be made after applying operations. A subarray is a contiguous non-empty sequence of elements within an array.`,
        examples: [{ "input": "nums = [5,2,2]", "output": "1" }, { "input": "nums = [1,2,3,4]", "output": "4" }, { "input": "nums = [4,3,2,6]", "output": "3" }],
        top_solution: `function findMaximumLength(nums) {
    const N = nums.length;
    const pre = [0];
    for (const x of nums) {
        pre.push(BigInt(x));
    }
    for (let i = 1; i <= N; i++) {
        pre[i] += pre[i - 1];
    }
    const dp = Array(N + 1).fill({ first: 0, second: 0 });
    dp[0] = { first: 0, second: 0 };
    for (let i = 1; i <= N; i++) {
        const [len, x] = [dp[i - 1].first, dp[i - 1].second];
        let newX = -1n * x;
        if (newX <= BigInt(nums[i - 1])) {
            dp[i] = { first: Math.max(dp[i].first, len + 1), second: -1n * BigInt(nums[i - 1]) };
        } else {
            dp[i] = { first: Math.max(dp[i].first, len), second: -1n * (newX + BigInt(nums[i - 1])) };
        }
        const lbneed = pre[i] - BigInt(nums[i - 1]) + newX;
        const id = pre.findIndex((val) => val >= lbneed);
        if (id !== -1 && id <= N) {
            dp[id] = { first: Math.max(dp[id].first, len + 1), second: -1n * (newX + pre[id] - lbneed) };
        }
    }
    return dp[N].first;
}

module.exports = { findMaximumLength };`,
        acceptance_rate: 4967.08,
        likes: 0,
        dislikes: 0
    },
    hard_frequencies_of_shortest_supersequences: {
        id: 2435,
        title: "Frequencies of Shortest Supersequences",
        slug: "frequencies-of-shortest-supersequences",
        difficulty: "Hard",
        category: "dynamic-programming",
        description: `You are given an array of strings words. Find all shortest common supersequences (SCS) of words that are not permutations of each other. A shortest common supersequence is a string of minimum length that contains each string in words as a subsequence. Return a 2D array of integers freqs that represent all the SCSs. Each freqs[i] is an array of size 26, representing the frequency of each letter in the lowercase English alphabet for a single SCS. You may return the frequency arrays in any order.`,
        examples: [{ "input": "words = [\"ab\",\"ba\"]", "output": "[[1,2,0,...],[2,1,0,...]]" }, { "input": "words = [\"aa\",\"ac\"]", "output": "[[2,0,1,0,...]]" }, { "input": "words = [\"aa\",\"bb\",\"cc\"]", "output": "[[2,2,2,0,...]]" }],
        top_solution: `const supersequences = words => {
  const ALPHABET_SIZE = 26;
  const ASCII = 'a'.charCodeAt(0);
  const usedChars = Array(ALPHABET_SIZE).fill(false);
  for (const word of words) {
    for (const char of word) {
      usedChars[char.charCodeAt(0) - ASCII] = true;
    }
  }
  const charToIndex = Array(ALPHABET_SIZE).fill(-1);
  const indexToChar = [];
  let uniqueCharCount = 0;
  for (let charCode = 0; charCode < ALPHABET_SIZE; charCode++) {
    if (usedChars[charCode]) {
      charToIndex[charCode] = uniqueCharCount++;
      indexToChar.push(String.fromCharCode(ASCII + charCode));
    }
  }
  const dependencyGraph = Array(uniqueCharCount).fill().map(() => Array(uniqueCharCount).fill(false));
  const hasSelfDependency = Array(uniqueCharCount).fill(false);
  for (const word of words) {
    const firstCharIndex = charToIndex[word[0].charCodeAt(0) - ASCII];
    const secondCharIndex = charToIndex[word[1].charCodeAt(0) - ASCII];
    if (firstCharIndex === secondCharIndex) {
      hasSelfDependency[firstCharIndex] = true;
    } else {
      dependencyGraph[firstCharIndex][secondCharIndex] = true;
    }
  }
  const findStronglyConnectedComponents = graph => {
    const nodeCount = graph.length;
    const discoveryTime = Array(nodeCount).fill(-1);
    const lowestReachable = Array(nodeCount).fill(0);
    const componentId = Array(nodeCount).fill(-1);
    const isInStack = Array(nodeCount).fill(false);
    const nodeStack = [];
    let time = 0;
    let componentCount = 0;
    const tarjanDFS = nodeId => {
      discoveryTime[nodeId] = lowestReachable[nodeId] = time++;
      nodeStack.push(nodeId);
      isInStack[nodeId] = true;
      for (let neighborId = 0; neighborId < nodeCount; neighborId++) {
        if (!graph[nodeId][neighborId]) continue;
        if (discoveryTime[neighborId] === -1) {
          tarjanDFS(neighborId);
          lowestReachable[nodeId] = Math.min(lowestReachable[nodeId], lowestReachable[neighborId]);
        } else if (isInStack[neighborId]) {
          lowestReachable[nodeId] = Math.min(lowestReachable[nodeId], discoveryTime[neighborId]);
        }
      }
      if (lowestReachable[nodeId] === discoveryTime[nodeId]) {
        while (true) {
          const poppedNode = nodeStack.pop();
          isInStack[poppedNode] = false;
          componentId[poppedNode] = componentCount;
          if (poppedNode === nodeId) break;
        }
        componentCount++;
      }
    };
    for (let nodeId = 0; nodeId < nodeCount; nodeId++) {
      if (discoveryTime[nodeId] === -1) {
        tarjanDFS(nodeId);
      }
    }
    return { componentId, componentCount };
  };
  const { componentId, componentCount } = findStronglyConnectedComponents(dependencyGraph);
  const componentMembers = Array(componentCount).fill().map(() => []);
  for (let nodeId = 0; nodeId < uniqueCharCount; nodeId++) {
    componentMembers[componentId[nodeId]].push(nodeId);
  }
  const condensedGraph = Array(componentCount).fill().map(() => []);
  const incomingEdgeCount = Array(componentCount).fill(0);
  for (let sourceNode = 0; sourceNode < uniqueCharCount; sourceNode++) {
    for (let targetNode = 0; targetNode < uniqueCharCount; targetNode++) {
      if (dependencyGraph[sourceNode][targetNode] && componentId[sourceNode] !== componentId[targetNode]) {
        condensedGraph[componentId[sourceNode]].push(componentId[targetNode]);
        incomingEdgeCount[componentId[targetNode]]++;
      }
    }
  }
  const topologicalOrder = [];
  const noIncomingEdgesQueue = [];
  for (let componentIdx = 0; componentIdx < componentCount; componentIdx++) {
    if (incomingEdgeCount[componentIdx] === 0) {
      noIncomingEdgesQueue.push(componentIdx);
    }
  }
  while (noIncomingEdgesQueue.length > 0) {
    const currentComponent = noIncomingEdgesQueue.shift();
    topologicalOrder.push(currentComponent);
    for (const nextComponent of condensedGraph[currentComponent]) {
      if (--incomingEdgeCount[nextComponent] === 0) {
        noIncomingEdgesQueue.push(nextComponent);
      }
    }
  }
  const isGraphAcyclicAfterRemoval = (graph, removalMask, nodeCount) => {
    const isNodeRemoved = Array(nodeCount).fill(false);
    for (let nodeId = 0; nodeId < nodeCount; nodeId++) {
      if (removalMask & (1 << nodeId)) {
        isNodeRemoved[nodeId] = true;
      }
    }
    const inDegree = Array(nodeCount).fill(0);
    for (let sourceNode = 0; sourceNode < nodeCount; sourceNode++) {
      if (isNodeRemoved[sourceNode]) continue;
      for (let targetNode = 0; targetNode < nodeCount; targetNode++) {
        if (!isNodeRemoved[targetNode] && graph[sourceNode][targetNode]) {
          inDegree[targetNode]++;
        }
      }
    }
    const zeroInDegreeQueue = [];
    let processedNodeCount = 0;
    const remainingNodeCount = nodeCount - countSetBits(removalMask);
    for (let nodeId = 0; nodeId < nodeCount; nodeId++) {
      if (!isNodeRemoved[nodeId] && inDegree[nodeId] === 0) {
        zeroInDegreeQueue.push(nodeId);
      }
    }
    while (zeroInDegreeQueue.length > 0) {
      const currentNode = zeroInDegreeQueue.shift();
      processedNodeCount++;
      for (let neighborNode = 0; neighborNode < nodeCount; neighborNode++) {
        if (!isNodeRemoved[neighborNode] && graph[currentNode][neighborNode] && --inDegree[neighborNode] === 0) {
          zeroInDegreeQueue.push(neighborNode);
        }
      }
    }
    return processedNodeCount === remainingNodeCount;
  };
  const countSetBits = number => {
    let count = 0;
    while (number > 0) {
      count += number & 1;
      number >>= 1;
    }
    return count;
  };
  const findMinimumFeedbackVertexSet = (graph, nodeCount) => {
    const frequencyPatterns = new Set();
    for (let setSize = 0; setSize <= nodeCount; setSize++) {
      let patternFound = false;
      for (let mask = 0; mask < (1 << nodeCount); mask++) {
        if (countSetBits(mask) !== setSize) continue;
        if (isGraphAcyclicAfterRemoval(graph, mask, nodeCount)) {
          const charFrequencies = Array(nodeCount).fill(1);
          for (let nodeId = 0; nodeId < nodeCount; nodeId++) {
            if (mask & (1 << nodeId)) {
              charFrequencies[nodeId] = 2;
            }
          }
          frequencyPatterns.add(charFrequencies.join(','));
          patternFound = true;
        }
      }
      if (patternFound) break;
    }
    return Array.from(frequencyPatterns).map(pattern => pattern.split(',').map(Number));
  };
  const componentPatterns = Array(componentCount);
  for (let componentIdx = 0; componentIdx < componentCount; componentIdx++) {
    const componentNodes = componentMembers[componentIdx];
    if (componentNodes.length === 1) {
      componentPatterns[componentIdx] = hasSelfDependency[componentNodes[0]] ? [[2]] : [[1]];
      continue;
    }
    const subgraph = Array(componentNodes.length).fill().map(() => Array(componentNodes.length).fill(false));
    const localToGlobalNodeMap = Array(componentNodes.length);
    for (let localIdx = 0; localIdx < componentNodes.length; localIdx++) {
      const globalNodeId = componentNodes[localIdx];
      localToGlobalNodeMap[localIdx] = globalNodeId;
      if (hasSelfDependency[globalNodeId]) {
        subgraph[localIdx][localIdx] = true;
      }
      for (let targetLocalIdx = 0; targetLocalIdx < componentNodes.length; targetLocalIdx++) {
        const targetGlobalId = componentNodes[targetLocalIdx];
        if (dependencyGraph[globalNodeId][targetGlobalId]) {
          subgraph[localIdx][targetLocalIdx] = true;
        }
      }
    }
    componentPatterns[componentIdx] = findMinimumFeedbackVertexSet(subgraph, componentNodes.length);
  }
  let frequencyCombinations = [[]];
  for (const componentIdx of topologicalOrder) {
    const newCombinations = [];
    for (const baseFrequency of frequencyCombinations) {
      for (const componentPattern of componentPatterns[componentIdx]) {
        const extendedFrequency = [...baseFrequency];
        while (extendedFrequency.length < uniqueCharCount) extendedFrequency.push(0);
        for (let localIdx = 0; localIdx < componentMembers[componentIdx].length; localIdx++) {
          const globalNodeId = componentMembers[componentIdx][localIdx];
          extendedFrequency[globalNodeId] = componentPattern[localIdx];
        }
        newCombinations.push(extendedFrequency);
      }
    }
    frequencyCombinations = newCombinations;
  }
  const uniqueFrequencyArrays = new Set();
  for (const charFrequencies of frequencyCombinations) {
    const alphabetFrequencies = Array(ALPHABET_SIZE).fill(0);
    for (let charIdx = 0; charIdx < uniqueCharCount; charIdx++) {
      alphabetFrequencies[indexToChar[charIdx].charCodeAt(0) - ASCII] = charFrequencies[charIdx];
    }
    uniqueFrequencyArrays.add(alphabetFrequencies.join(','));
  }
  return Array.from(uniqueFrequencyArrays).map(frequencyString => frequencyString.split(',').map(Number));
};

module.exports = supersequences;`,
        acceptance_rate: 4967.08,
        likes: 0,
        dislikes: 0
    },
    hard_count_stable_subarrays: {
        id: 3748,
        title: "Count Stable Subarrays",
        slug: "count-stable-subarrays",
        difficulty: "Hard",
        category: "binary-search",
        description: `You are given an integer array nums. A subarray of nums is called stable if it contains no inversions, i.e., there is no pair of indices i < j such that nums[i] > nums[j]. You are also given a 2D integer array queries of length q, where each queries[i] = [li, ri] represents a query. For each query [li, ri], compute the number of stable subarrays that lie entirely within the segment nums[li..ri]. Return an integer array ans of length q, where ans[i] is the answer to the ith query. Note: A single element subarray is considered stable.`,
        examples: [{ "input": "nums = [3,1,2], queries = [[0,1],[1,2],[0,2]]", "output": "[2,3,4]" }, { "input": "nums = [2,2], queries = [[0,1],[0,0]]", "output": "[3,1]" }],
        top_solution: `var countStableSubarrays = function (nums, queries) {
  const n = nums.length;
  const m = queries.length;
  const preSum = new Array(n + 1).fill(0);
  preSum[1] = 1;
  let streaks = 1;
  for (let i = 1; i < n; i++) {
    if (nums[i] < nums[i - 1]) {
      streaks = 1;
    } else {
      streaks++;
    }
    preSum[i + 1] = preSum[i] + streaks;
  }
  const inversion = new Array(n).fill();
  inversion[inversion.length - 1] = n;
  for (let i = n - 2; i >= 0; i--) {
    if (nums[i] > nums[i + 1]) {
      inversion[i] = i + 1;
    } else {
      inversion[i] = inversion[i + 1];
    }
  }
  const ans = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    const [left, right] = queries[i];
    const idx = inversion[left];
    if (idx > right) {
      const size = right - left + 1;
      ans[i] = (size * (size + 1)) / 2;
    } else {
      const size = idx - left;
      const count = preSum[right + 1] - preSum[idx];
      ans[i] = (size * (size + 1)) / 2 + count;
    }
  }
  return ans;
};

module.exports = { countStableSubarrays };`,
        acceptance_rate: 4967.08,
        likes: 0,
        dislikes: 0
    },
    hard_shortest_subarray_with_sum_at_least_k: {
        id: 862,
        title: "Shortest Subarray with Sum at Least K",
        slug: "shortest-subarray-with-sum-at-least-k",
        difficulty: "Hard",
        category: "arrays",
        description: `Given an integer array nums and an integer k, return the length of the shortest non-empty subarray of nums with a sum of at least k. If there is no such subarray, return -1. A subarray is a contiguous part of an array.`,
        examples: [{ "input": "nums = [1], k = 1", "output": "1" }, { "input": "nums = [1,2], k = 4", "output": "-1" }, { "input": "nums = [2,-1,2], k = 3", "output": "3" }],
        top_solution: `function shortestSubarray(nums, k) {
    const n = nums.length;
    const sum = new Array(n + 1).fill(0);
    for (let i = 0; i < n; i++) {
        sum[i + 1] = sum[i] + nums[i];
    }
    const q = new Array(n + 1).fill(0);
    let l = 0;
    let r = 0;
    let minLength = n + 1;
    for (let i = 0; i < sum.length; i++) {
        while (r > l && sum[i] >= sum[q[l]] + k) {
            minLength = Math.min(minLength, i - q[l]);
            l++;
        }
        while (r > l && sum[i] <= sum[q[r - 1]]) {
            r--;
        }
        q[r] = i;
        r++;
    }
    return minLength <= n ? minLength : -1;
}

module.exports = { shortestSubarray };`,
        acceptance_rate: 4967.08,
        likes: 0,
        dislikes: 0
    }
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

export const getProblemLink = (slug: string): string => {
    return `https://leetcode.com/problems/${slug}/`;
};

export const getProblemTypeFromCategory = (category: string): string => {
    const categoryToType: Record<string, string> = {
        "arrays": "Array",
        "hash-tables": "Hash Table",
        "strings": "String",
        "linked-lists": "Linked List",
        "math": "Math",
        "two-pointers": "Two Pointers",
        "binary-search": "Binary Search",
        "dynamic-programming": "Dynamic Programming",
        "greedy": "Greedy",
        "backtracking": "Backtracking",
        "trees": "Tree",
        "graphs": "Graph",
        "heap": "Heap",
        "sorting": "Sorting",
        "geometry": "Geometry",
    };
    return categoryToType[category.toLowerCase()] || category;
};

export const getProblemDefinitionFromLeetCodeProblem = (
    problemKey: string
): {
    problem_name: string;
    leetcode_link: string;
    rank: string;
    problem_type: string;
    definition: string;
} | null => {
    const problem = LEETCODE_PROBLEMS[problemKey];
    if (!problem) return null;

    return {
        problem_name: problem.title,
        leetcode_link: problem.leetcode_link || getProblemLink(problem.slug),
        rank: problem.difficulty,
        problem_type: problem.problem_type || getProblemTypeFromCategory(problem.category),
        definition: problem.description,
    };
};
