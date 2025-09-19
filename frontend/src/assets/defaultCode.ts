export interface DefaultCodeEntry {
    language: string;
    code: string;
    description: string;
}

export const LEETCODE_PROBLEMS: Record<string, DefaultCodeEntry> = {
    easy_two_sum: {
        language: "javascript",
        description: "Two Sum - Easy: Find indices of two numbers that add up to target",
        code: `function twoSum(nums, target) {
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

module.exports = { twoSum };`
    },

    easy_palindrome: {
        language: "javascript",
        description: "Valid Palindrome - Easy: Check if string is a valid palindrome",
        code: `function isPalindrome(s) {
    const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    let left = 0;
    let right = cleaned.length - 1;
    
    while (left < right) {
        if (cleaned[left] !== cleaned[right]) {
            return false;
        }
        left++;
        right--;
    }
    
    return true;
}

module.exports = { isPalindrome };`
    },

    easy_reverse_integer: {
        language: "javascript",
        description: "Reverse Integer - Easy: Reverse digits of an integer",
        code: `function reverse(x) {
    const sign = Math.sign(x);
    const reversed = parseInt(Math.abs(x).toString().split('').reverse().join(''));
    
    if (reversed > Math.pow(2, 31) - 1) {
        return 0;
    }
    
    return sign * reversed;
}

module.exports = { reverse };`
    },

    medium_longest_substring: {
        language: "javascript",
        description: "Longest Substring Without Repeating Characters - Medium",
        code: `function lengthOfLongestSubstring(s) {
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

module.exports = { lengthOfLongestSubstring };`
    },

    medium_group_anagrams: {
        language: "javascript",
        description: "Group Anagrams - Medium: Group strings that are anagrams",
        code: `function groupAnagrams(strs) {
    const map = new Map();
    
    for (const str of strs) {
        const sorted = str.split('').sort().join('');
        
        if (!map.has(sorted)) {
            map.set(sorted, []);
        }
        
        map.get(sorted).push(str);
    }
    
    return Array.from(map.values());
}

module.exports = { groupAnagrams };`
    },

    medium_three_sum: {
        language: "javascript",
        description: "3Sum - Medium: Find all unique triplets that sum to zero",
        code: `function threeSum(nums) {
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

module.exports = { threeSum };`
    },

    hard_median_sorted_arrays: {
        language: "javascript",
        description: "Median of Two Sorted Arrays - Hard: Find median efficiently",
        code: `function findMedianSortedArrays(nums1, nums2) {
    if (nums1.length > nums2.length) {
        return findMedianSortedArrays(nums2, nums1);
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
}

module.exports = { findMedianSortedArrays };`
    },

    hard_trapping_rain_water: {
        language: "javascript",
        description: "Trapping Rain Water - Hard: Calculate trapped rainwater",
        code: `function trap(height) {
    if (!height || height.length < 3) return 0;
    
    let left = 0;
    let right = height.length - 1;
    let leftMax = 0;
    let rightMax = 0;
    let water = 0;
    
    while (left < right) {
        if (height[left] < height[right]) {
            if (height[left] >= leftMax) {
                leftMax = height[left];
            } else {
                water += leftMax - height[left];
            }
            left++;
        } else {
            if (height[right] >= rightMax) {
                rightMax = height[right];
            } else {
                water += rightMax - height[right];
            }
            right--;
        }
    }
    
    return water;
}

module.exports = { trap };`
    },

    hard_longest_valid_parentheses: {
        language: "javascript",
        description: "Longest Valid Parentheses - Hard: Find length of longest valid parentheses substring",
        code: `function longestValidParentheses(s) {
    const stack = [-1];
    let maxLength = 0;
    
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') {
            stack.push(i);
        } else {
            stack.pop();
            
            if (stack.length === 0) {
                stack.push(i);
            } else {
                maxLength = Math.max(maxLength, i - stack[stack.length - 1]);
            }
        }
    }
    
    return maxLength;
}

module.exports = { longestValidParentheses };`
    }
};

export const getDefaultCodeForLanguage = (problemKey: string): string => {
    const entry = LEETCODE_PROBLEMS[problemKey];
    return entry ? entry.code : LEETCODE_PROBLEMS.easy_two_sum.code;
};

export const getSupportedProblems = (): string[] => {
    return Object.keys(LEETCODE_PROBLEMS);
};

export const getProblemDescription = (problemKey: string): string => {
    const entry = LEETCODE_PROBLEMS[problemKey];
    return entry ? entry.description : "Two Sum - Easy";
};

export const getProblemsByDifficulty = () => {
    const problems = Object.entries(LEETCODE_PROBLEMS);
    return {
        easy: problems.filter(([key]) => key.startsWith('easy_')),
        medium: problems.filter(([key]) => key.startsWith('medium_')),
        hard: problems.filter(([key]) => key.startsWith('hard_'))
    };
};
