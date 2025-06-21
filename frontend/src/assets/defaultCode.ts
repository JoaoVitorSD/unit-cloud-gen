export interface DefaultCodeEntry {
    language: string;
    code: string;
    description: string;
}

export const DEFAULT_USER_CLASSES: Record<string, DefaultCodeEntry> = {
    python: {
        language: "python",
        description: "Python User class with basic properties and methods",
        code: `class User:
    def __init__(self, user_id: int, username: str, email: str, first_name: str = "", last_name: str = ""):
        self.user_id = user_id
        self.username = username
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.is_active = True
        self.created_at = None
    
    def get_full_name(self) -> str:
        """Return the full name of the user."""
        return f"{self.first_name} {self.last_name}".strip()
    
    def deactivate(self) -> None:
        """Deactivate the user account."""
        self.is_active = False
    
    def update_email(self, new_email: str) -> bool:
        """Update user email with basic validation."""
        if "@" in new_email and "." in new_email:
            self.email = new_email
            return True
        return False
    
    def __str__(self) -> str:
        return f"User(id={self.user_id}, username='{self.username}', email='{self.email}')"
    
    def __repr__(self) -> str:
        return self.__str__()`,
    },

    javascript: {
        language: "javascript",
        description: "JavaScript User class with ES6+ syntax",
        code: `class User {
    constructor(userId, username, email, firstName = "", lastName = "") {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.isActive = true;
        this.createdAt = new Date();
    }
    
    getFullName() {
        return \`\${this.firstName} \${this.lastName}\`.trim();
    }
    
    deactivate() {
        this.isActive = false;
    }
    
    updateEmail(newEmail) {
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (emailRegex.test(newEmail)) {
            this.email = newEmail;
            return true;
        }
        return false;
    }
    
    toJSON() {
        return {
            userId: this.userId,
            username: this.username,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            isActive: this.isActive,
            createdAt: this.createdAt
        };
    }
    
    toString() {
        return \`User(id=\${this.userId}, username='\${this.username}', email='\${this.email}')\`;
    }
}`,
    },

    typescript: {
        language: "typescript",
        description: "TypeScript User class with full type definitions",
        code: `interface UserData {
    userId: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
}

class User {
    public readonly userId: number;
    public username: string;
    public email: string;
    public firstName: string;
    public lastName: string;
    public isActive: boolean;
    public readonly createdAt: Date;
    
    constructor(userData: UserData) {
        this.userId = userData.userId;
        this.username = userData.username;
        this.email = userData.email;
        this.firstName = userData.firstName || "";
        this.lastName = userData.lastName || "";
        this.isActive = true;
        this.createdAt = new Date();
    }
    
    getFullName(): string {
        return \`\${this.firstName} \${this.lastName}\`.trim();
    }
    
    deactivate(): void {
        this.isActive = false;
    }
    
    updateEmail(newEmail: string): boolean {
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (emailRegex.test(newEmail)) {
            this.email = newEmail;
            return true;
        }
        return false;
    }
    
    toJSON(): UserData & { isActive: boolean; createdAt: Date } {
        return {
            userId: this.userId,
            username: this.username,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            isActive: this.isActive,
            createdAt: this.createdAt
        };
    }
    
    toString(): string {
        return \`User(id=\${this.userId}, username='\${this.username}', email='\${this.email}')\`;
    }
}`,
    },

    java: {
        language: "java",
        description: "Java User class with proper encapsulation and JavaDoc",
        code: `import java.time.LocalDateTime;
import java.util.Objects;
import java.util.regex.Pattern;

/**
 * Represents a User entity with basic user information and operations.
 */
public class User {
    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\\\.[A-Za-z]{2,})$");
    
    private final Long userId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private boolean isActive;
    private final LocalDateTime createdAt;
    
    /**
     * Constructs a new User with the specified details.
     */
    public User(Long userId, String username, String email, String firstName, String lastName) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.firstName = firstName != null ? firstName : "";
        this.lastName = lastName != null ? lastName : "";
        this.isActive = true;
        this.createdAt = LocalDateTime.now();
    }
    
    public User(Long userId, String username, String email) {
        this(userId, username, email, "", "");
    }
    
    // Getters
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public boolean isActive() { return isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    
    // Setters
    public void setUsername(String username) { this.username = username; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    /**
     * Returns the full name of the user.
     */
    public String getFullName() {
        return (firstName + " " + lastName).trim();
    }
    
    /**
     * Deactivates the user account.
     */
    public void deactivate() {
        this.isActive = false;
    }
    
    /**
     * Updates the user's email address with validation.
     */
    public boolean updateEmail(String newEmail) {
        if (EMAIL_PATTERN.matcher(newEmail).matches()) {
            this.email = newEmail;
            return true;
        }
        return false;
    }
    
    @Override
    public String toString() {
        return String.format("User(id=%d, username='%s', email='%s')", 
                           userId, username, email);
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        User user = (User) obj;
        return Objects.equals(userId, user.userId);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(userId);
    }
}`,
    },

    csharp: {
        language: "csharp",
        description: "C# User class with properties and data annotations",
        code: `using System;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

/// <summary>
/// Represents a User entity with basic user information and operations.
/// </summary>
public class User
{
    private static readonly Regex EmailRegex = 
        new Regex(@"^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$", RegexOptions.Compiled);
    
    [Key]
    public long UserId { get; }
    
    [Required]
    [StringLength(50)]
    public string Username { get; set; }
    
    [Required]
    [EmailAddress]
    public string Email { get; private set; }
    
    [StringLength(100)]
    public string FirstName { get; set; }
    
    [StringLength(100)]
    public string LastName { get; set; }
    
    public bool IsActive { get; private set; }
    
    public DateTime CreatedAt { get; }
    
    /// <summary>
    /// Initializes a new instance of the User class.
    /// </summary>
    public User(long userId, string username, string email, string firstName = "", string lastName = "")
    {
        UserId = userId;
        Username = username ?? throw new ArgumentNullException(nameof(username));
        Email = email ?? throw new ArgumentNullException(nameof(email));
        FirstName = firstName ?? "";
        LastName = lastName ?? "";
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
    }
    
    /// <summary>
    /// Gets the full name of the user.
    /// </summary>
    public string GetFullName()
    {
        return $"{FirstName} {LastName}".Trim();
    }
    
    /// <summary>
    /// Deactivates the user account.
    /// </summary>
    public void Deactivate()
    {
        IsActive = false;
    }
    
    /// <summary>
    /// Updates the user's email address with validation.
    /// </summary>
    public bool UpdateEmail(string newEmail)
    {
        if (string.IsNullOrWhiteSpace(newEmail))
            return false;
            
        if (EmailRegex.IsMatch(newEmail))
        {
            Email = newEmail;
            return true;
        }
        return false;
    }
    
    public override string ToString()
    {
        return $"User(id={UserId}, username='{Username}', email='{Email}')";
    }
    
    public override bool Equals(object obj)
    {
        return obj is User user && UserId == user.UserId;
    }
    
    public override int GetHashCode()
    {
        return UserId.GetHashCode();
    }
}`,
    },

    go: {
        language: "go",
        description: "Go User struct with methods and JSON tags",
        code: `package main

import (
    "fmt"
    "regexp"
    "strings"
    "time"
)

// User represents a user entity with basic information and operations
type User struct {
    UserID    int64     \`json:"user_id"\`
    Username  string    \`json:"username"\`
    Email     string    \`json:"email"\`
    FirstName string    \`json:"first_name"\`
    LastName  string    \`json:"last_name"\`
    IsActive  bool      \`json:"is_active"\`
    CreatedAt time.Time \`json:"created_at"\`
}

var emailRegex = regexp.MustCompile(\`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\`)

// NewUser creates a new User instance
func NewUser(userID int64, username, email, firstName, lastName string) *User {
    return &User{
        UserID:    userID,
        Username:  username,
        Email:     email,
        FirstName: firstName,
        LastName:  lastName,
        IsActive:  true,
        CreatedAt: time.Now(),
    }
}

// GetFullName returns the full name of the user
func (u *User) GetFullName() string {
    return strings.TrimSpace(fmt.Sprintf("%s %s", u.FirstName, u.LastName))
}

// Deactivate deactivates the user account
func (u *User) Deactivate() {
    u.IsActive = false
}

// UpdateEmail updates the user's email address with validation
func (u *User) UpdateEmail(newEmail string) bool {
    if emailRegex.MatchString(newEmail) {
        u.Email = newEmail
        return true
    }
    return false
}

// String returns a string representation of the user
func (u *User) String() string {
    return fmt.Sprintf("User(id=%d, username='%s', email='%s')", u.UserID, u.Username, u.Email)
}`,
    },

    rust: {
        language: "rust",
        description: "Rust User struct with proper ownership and error handling",
        code: `use chrono::{DateTime, Utc};
use regex::Regex;
use std::fmt;

#[derive(Debug, Clone)]
pub struct User {
    user_id: u64,
    username: String,
    email: String,
    first_name: String,
    last_name: String,
    is_active: bool,
    created_at: DateTime<Utc>,
}

impl User {
    /// Creates a new User instance
    pub fn new(
        user_id: u64,
        username: String,
        email: String,
        first_name: Option<String>,
        last_name: Option<String>,
    ) -> Self {
        Self {
            user_id,
            username,
            email,
            first_name: first_name.unwrap_or_default(),
            last_name: last_name.unwrap_or_default(),
            is_active: true,
            created_at: Utc::now(),
        }
    }
    
    // Getters
    pub fn user_id(&self) -> u64 { self.user_id }
    pub fn username(&self) -> &str { &self.username }
    pub fn email(&self) -> &str { &self.email }
    pub fn first_name(&self) -> &str { &self.first_name }
    pub fn last_name(&self) -> &str { &self.last_name }
    pub fn is_active(&self) -> bool { self.is_active }
    pub fn created_at(&self) -> DateTime<Utc> { self.created_at }
    
    /// Returns the full name of the user
    pub fn get_full_name(&self) -> String {
        format!("{} {}", self.first_name, self.last_name).trim().to_string()
    }
    
    /// Deactivates the user account
    pub fn deactivate(&mut self) {
        self.is_active = false;
    }
    
    /// Updates the user's email address with validation
    pub fn update_email(&mut self, new_email: String) -> Result<(), &'static str> {
        let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
            .unwrap();
            
        if email_regex.is_match(&new_email) {
            self.email = new_email;
            Ok(())
        } else {
            Err("Invalid email format")
        }
    }
    
    /// Updates the username
    pub fn set_username(&mut self, username: String) {
        self.username = username;
    }
    
    /// Updates the first name
    pub fn set_first_name(&mut self, first_name: String) {
        self.first_name = first_name;
    }
    
    /// Updates the last name
    pub fn set_last_name(&mut self, last_name: String) {
        self.last_name = last_name;
    }
}

impl fmt::Display for User {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "User(id={}, username='{}', email='{}')", 
               self.user_id, self.username, self.email)
    }
}

impl PartialEq for User {
    fn eq(&self, other: &Self) -> bool {
        self.user_id == other.user_id
    }
}`,
    }
};

export const getDefaultCodeForLanguage = (language: string): string => {
    const entry = DEFAULT_USER_CLASSES[language.toLowerCase()];
    return entry ? entry.code : DEFAULT_USER_CLASSES.python.code;
};

export const getSupportedLanguages = (): string[] => {
    return Object.keys(DEFAULT_USER_CLASSES);
};

export const getLanguageDescription = (language: string): string => {
    const entry = DEFAULT_USER_CLASSES[language.toLowerCase()];
    return entry ? entry.description : "Default Python User class";
}; 