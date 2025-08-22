class DataValidator {
  constructor() {
    this.customValidators = new Map();
    this.validationCache = new Map();
  }

  validateEmail(email) {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  validatePhoneNumber(phone, countryCode = "US") {
    if (!phone || typeof phone !== "string") return false;

    const cleanPhone = phone.replace(/\D/g, "");

    const countryPatterns = {
      US: { min: 10, max: 11, pattern: /^1?\d{10}$/ },
      UK: { min: 10, max: 11, pattern: /^44\d{10}$/ },
      DE: { min: 10, max: 15, pattern: /^49\d{6,15}$/ },
      FR: { min: 10, max: 12, pattern: /^33\d{9,11}$/ },
    };

    const pattern = countryPatterns[countryCode];
    if (!pattern) return false;

    return (
      cleanPhone.length >= pattern.min &&
      cleanPhone.length <= pattern.max &&
      pattern.pattern.test(cleanPhone)
    );
  }

  validateCreditCard(cardNumber, cardType = "auto") {
    if (!cardNumber || typeof cardNumber !== "string") return false;

    const cleanNumber = cardNumber.replace(/\D/g, "");
    if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;

    const cardPatterns = {
      visa: /^4\d{12}(\d{3})?$/,
      mastercard: /^5[1-5]\d{14}$/,
      amex: /^3[47]\d{13}$/,
      discover: /^6(?:011|5\d{2})\d{12}$/,
    };

    if (cardType !== "auto") {
      return (
        cardPatterns[cardType]?.test(cleanNumber) && this.luhnCheck(cleanNumber)
      );
    }

    for (const [type, pattern] of Object.entries(cardPatterns)) {
      if (pattern.test(cleanNumber)) {
        return this.luhnCheck(cleanNumber);
      }
    }

    return false;
  }

  luhnCheck(number) {
    let sum = 0;
    let isEven = false;

    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  validateBusinessRules(data, rules) {
    const errors = [];
    const cacheKey = JSON.stringify({ data, rules });

    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey);
    }

    for (const [field, ruleSet] of Object.entries(rules)) {
      const value = this.getNestedValue(data, field);

      if (
        ruleSet.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (ruleSet.type && !this.validateType(value, ruleSet.type)) {
          errors.push(`${field} must be of type ${ruleSet.type}`);
        }

        if (ruleSet.min !== undefined && value < ruleSet.min) {
          errors.push(`${field} must be at least ${ruleSet.min}`);
        }

        if (ruleSet.max !== undefined && value > ruleSet.max) {
          errors.push(`${field} must be at most ${ruleSet.max}`);
        }

        if (ruleSet.pattern && !ruleSet.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }

        if (ruleSet.custom && this.customValidators.has(ruleSet.custom)) {
          const customValidator = this.customValidators.get(ruleSet.custom);
          if (!customValidator(value, data)) {
            errors.push(`${field} failed custom validation`);
          }
        }
      }
    }

    this.validationCache.set(cacheKey, errors);
    return errors;
  }

  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  validateType(value, type) {
    switch (type) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      case "array":
        return Array.isArray(value);
      case "object":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      case "date":
        return value instanceof Date && !isNaN(value);
      case "email":
        return this.validateEmail(value);
      case "phone":
        return this.validatePhoneNumber(value);
      case "creditCard":
        return this.validateCreditCard(value);
      default:
        return true;
    }
  }

  addCustomValidator(name, validator) {
    if (typeof validator === "function") {
      this.customValidators.set(name, validator);
    }
  }

  clearCache() {
    this.validationCache.clear();
  }

  validateComplexObject(obj, schema) {
    const errors = [];

    for (const [key, schemaRule] of Object.entries(schema)) {
      const value = obj[key];

      if (schemaRule.required && (value === undefined || value === null)) {
        errors.push(`${key} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (schemaRule.type === "object" && schemaRule.properties) {
          const nestedErrors = this.validateComplexObject(
            value,
            schemaRule.properties
          );
          errors.push(...nestedErrors.map((error) => `${key}.${error}`));
        } else if (schemaRule.type === "array" && schemaRule.items) {
          if (!Array.isArray(value)) {
            errors.push(`${key} must be an array`);
          } else {
            value.forEach((item, index) => {
              if (schemaRule.items.type === "object") {
                const itemErrors = this.validateComplexObject(
                  item,
                  schemaRule.items.properties
                );
                errors.push(
                  ...itemErrors.map((error) => `${key}[${index}].${error}`)
                );
              } else if (!this.validateType(item, schemaRule.items.type)) {
                errors.push(
                  `${key}[${index}] must be of type ${schemaRule.items.type}`
                );
              }
            });
          }
        } else if (!this.validateType(value, schemaRule.type)) {
          errors.push(`${key} must be of type ${schemaRule.type}`);
        }
      }
    }

    return errors;
  }
}

export default DataValidator;
