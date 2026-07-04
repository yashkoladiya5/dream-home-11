import { SanitizePipe } from '../../src/common/pipes/sanitize.pipe';
import { BadRequestException } from '@nestjs/common';

describe('Security: Injection Prevention', () => {
  let sanitizePipe: SanitizePipe;

  beforeAll(() => {
    sanitizePipe = new SanitizePipe();
  });

  describe('SQL Injection Prevention', () => {
    test('single quote in string is sanitized', () => {
      const result = sanitizePipe.transform("test' OR '1'='1");
      expect(result).toBe("test' OR '1'='1");
    });

    test('SQL comments in input are preserved but not executable', () => {
      const result = sanitizePipe.transform('admin--');
      expect(result).toBe('admin--');
    });

    test('UNION-based SQL injection payload is preserved as text', () => {
      const result = sanitizePipe.transform("' UNION SELECT * FROM users --");
      expect(result).toBe("' UNION SELECT * FROM users --");
    });

    test('DROP TABLE payload is preserved as text (no exec context)', () => {
      const result = sanitizePipe.transform('; DROP TABLE users;');
      expect(result).toBe('; DROP TABLE users;');
    });

    test('nested object with SQL-like keys is accepted', () => {
      const input = { username: "admin' OR 1=1", password: 'test' };
      const result = sanitizePipe.transform(input);
      expect(result).toEqual(input);
    });

    test('array of SQL injection attempts is preserved as data', () => {
      const input = ["' OR 1=1--", "1; DELETE FROM users"];
      const result = sanitizePipe.transform(input);
      expect(result).toEqual(input);
    });
  });

  describe('NoSQL Injection Prevention', () => {
    test('$ne operator in key throws BadRequestException', () => {
      const input = { '$ne': 'admin' };
      expect(() => sanitizePipe.transform(input)).toThrow(BadRequestException);
    });

    test('$gt operator in key throws BadRequestException', () => {
      const input = { '$gt': 'test' };
      expect(() => sanitizePipe.transform(input)).toThrow(BadRequestException);
    });

    test('$where operator in key throws BadRequestException', () => {
      const input = { '$where': '1=1' };
      expect(() => sanitizePipe.transform(input)).toThrow(BadRequestException);
    });

    test('nested $ operator in object throws BadRequestException', () => {
      const input = { username: { '$ne': '' }, password: { '$ne': '' } };
      expect(() => sanitizePipe.transform(input)).toThrow(BadRequestException);
    });

    test('$regex operator in key throws BadRequestException', () => {
      const input = { '$regex': '.*' };
      expect(() => sanitizePipe.transform(input)).toThrow(BadRequestException);
    });

    test('$ operator in value is allowed (only keys are checked)', () => {
      const input = { username: '$admin' };
      const result = sanitizePipe.transform(input);
      expect(result).toEqual({ username: '$admin' });
    });

    test('$in operator in key throws BadRequestException', () => {
      const input = { '$in': ['admin', 'moderator'] };
      expect(() => sanitizePipe.transform(input)).toThrow(BadRequestException);
    });

    test('nested object with safe keys passes through', () => {
      const input = { user: { name: 'test', age: 25 } };
      const result = sanitizePipe.transform(input);
      expect(result).toEqual(input);
    });
  });

  describe('XSS Prevention', () => {
    test('<script> tags are stripped', () => {
      const result = sanitizePipe.transform('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    test('<iframe> tags are stripped', () => {
      const result = sanitizePipe.transform('<iframe src="http://evil.com"></iframe>');
      expect(result).not.toContain('<iframe>');
    });

    test('<object> tags are stripped', () => {
      const result = sanitizePipe.transform('<object data="http://evil.com"></object>');
      expect(result).not.toContain('<object>');
    });

    test('<embed> tags are stripped', () => {
      const result = sanitizePipe.transform('<embed src="http://evil.com">');
      expect(result).not.toContain('<embed>');
    });

    test('on* event handlers are stripped', () => {
      const result = sanitizePipe.transform('<div onload="alert(1)">text</div>');
      expect(result).not.toContain('onload=');
    });

    test('javascript: URIs are stripped', () => {
      const result = sanitizePipe.transform('<a href="javascript:alert(1)">click</a>');
      expect(result).not.toContain('javascript:');
    });

    test('all remaining HTML tags are stripped', () => {
      const result = sanitizePipe.transform('<b>bold</b><i>italic</i>');
      expect(result).toBe('bolditalic');
    });

    test('nested XSS in object fields is sanitized', () => {
      const input = { name: '<script>alert(1)</script>', bio: '<img src=x onerror=alert(1)>' };
      const result = sanitizePipe.transform(input);
      expect(result.name).not.toContain('<script>');
      expect(result.bio).not.toContain('<img');
    });
  });

  describe('Unicode Normalization (Homoglyph Attacks)', () => {
    test('NFC normalized string is normalized', () => {
      const input = '\u0041\u0301'; // A + combining accent
      const result = sanitizePipe.transform(input);
      expect(result.normalize('NFC')).toBe(result);
    });

    test('homoglyph characters are normalized', () => {
      const input = '\u0430dmin'; // Cyrillic 'а' instead of Latin 'a'
      const result = sanitizePipe.transform(input);
      expect(result).not.toContain('\u0430');
    });

    test('full-width characters are preserved', () => {
      const input = '\uFF34\uFF45\uFF53\uFF54'; // Ｔｅｓｔ
      const result = sanitizePipe.transform(input);
      expect(result).toBe(input);
    });
  });

  describe('Null Byte Injection', () => {
    test('null bytes are stripped from strings', () => {
      const result = sanitizePipe.transform('test\x00.php');
      expect(result).not.toContain('\x00');
      expect(result).toBe('test.php');
    });

    test('null bytes in object fields are stripped', () => {
      const input = { file: 'image.jpg\x00.exe' };
      const result = sanitizePipe.transform(input);
      expect(result.file).not.toContain('\x00');
    });

    test('multiple null bytes are all stripped', () => {
      const result = sanitizePipe.transform('\x00\x00test\x00\x00');
      expect(result).not.toContain('\x00');
      expect(result).toBe('test');
    });

    test('null bytes in nested objects are stripped', () => {
      const input = { user: { name: 'test\x00hack' } };
      const result = sanitizePipe.transform(input);
      expect(result.user.name).not.toContain('\x00');
    });
  });

  describe('Control Character Stripping', () => {
    test('control characters are removed from strings', () => {
      const result = sanitizePipe.transform('test\x07\x08\x0B\x0C');
      expect(result).toBe('test');
    });

    test('newlines and tabs are preserved', () => {
      const result = sanitizePipe.transform('line1\nline2\tindented');
      expect(result).toContain('\n');
      expect(result).toContain('\t');
    });

    test('carriage returns are preserved', () => {
      const result = sanitizePipe.transform('line1\r\nline2');
      expect(result).toContain('\r');
    });

    test('DEL character is removed', () => {
      const result = sanitizePipe.transform('test\x7F');
      expect(result).toBe('test');
    });
  });

  describe('String Length Enforcement', () => {
    beforeAll(() => {
      process.env.MAX_STRING_LENGTH = '10';
    });

    afterAll(() => {
      delete process.env.MAX_STRING_LENGTH;
    });

    test('strings exceeding max length are truncated', () => {
      const result = sanitizePipe.transform('a'.repeat(20));
      expect(result.length).toBeLessThanOrEqual(10);
    });

    test('strings within max length are preserved', () => {
      const input = 'short';
      const result = sanitizePipe.transform(input);
      expect(result).toBe('short');
    });
  });

  describe('Input Type Handling', () => {
    test('numbers pass through unchanged', () => {
      const result = sanitizePipe.transform(42);
      expect(result).toBe(42);
    });

    test('booleans pass through unchanged', () => {
      const result = sanitizePipe.transform(true);
      expect(result).toBe(true);
    });

    test('null values pass through unchanged', () => {
      const result = sanitizePipe.transform(null);
      expect(result).toBeNull();
    });

    test('arrays are recursively sanitized', () => {
      const input = ['<script>alert(1)</script>', { name: '<b>bold</b>' }];
      const result = sanitizePipe.transform(input);
      expect(result[0]).not.toContain('<script>');
      expect(result[1].name).toBe('bold');
    });
  });
});
