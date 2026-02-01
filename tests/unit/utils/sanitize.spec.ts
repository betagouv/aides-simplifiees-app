import { test } from '@japa/runner'
import { sanitizeHtml, sanitizePlainText, sanitizeUrl, stripHtml } from '../../../app/utils/sanitize.js'

test.group('sanitize.ts - sanitizeHtml', () => {
  test('should return empty string for null/undefined input', ({ assert }) => {
    assert.equal(sanitizeHtml(null as unknown as string), '')
    assert.equal(sanitizeHtml(undefined as unknown as string), '')
    assert.equal(sanitizeHtml(''), '')
  })

  test('should return empty string for non-string input', ({ assert }) => {
    assert.equal(sanitizeHtml(123 as unknown as string), '')
    assert.equal(sanitizeHtml({} as unknown as string), '')
  })

  test('should preserve allowed HTML tags', ({ assert }) => {
    const input = '<p>Hello <strong>world</strong></p>'
    const result = sanitizeHtml(input)
    assert.include(result, '<p>')
    assert.include(result, '<strong>')
  })

  test('should remove script tags', ({ assert }) => {
    const input = '<p>Hello</p><script>alert("xss")</script>'
    const result = sanitizeHtml(input)
    assert.notInclude(result, '<script>')
    assert.notInclude(result, 'alert')
    assert.include(result, '<p>Hello</p>')
  })

  test('should remove event handlers', ({ assert }) => {
    const input = '<p onclick="alert(1)">Click me</p>'
    const result = sanitizeHtml(input)
    assert.notInclude(result, 'onclick')
    assert.include(result, '<p>Click me</p>')
  })

  test('should remove javascript: URLs from links', ({ assert }) => {
    const input = '<a href="javascript:alert(1)">Link</a>'
    const result = sanitizeHtml(input)
    assert.notInclude(result, 'javascript:')
  })

  test('should preserve safe links', ({ assert }) => {
    const input = '<a href="https://example.com" title="Example">Link</a>'
    const result = sanitizeHtml(input)
    assert.include(result, 'href="https://example.com"')
    assert.include(result, 'title="Example"')
  })

  test('should preserve images with safe sources', ({ assert }) => {
    const input = '<img src="https://example.com/image.png" alt="Test">'
    const result = sanitizeHtml(input)
    assert.include(result, 'src="https://example.com/image.png"')
    assert.include(result, 'alt="Test"')
  })

  test('should remove iframe tags', ({ assert }) => {
    const input = '<iframe src="https://evil.com"></iframe>'
    const result = sanitizeHtml(input)
    assert.notInclude(result, '<iframe')
  })

  test('should remove object/embed tags', ({ assert }) => {
    const input = '<object data="malware.swf"></object><embed src="malware.swf">'
    const result = sanitizeHtml(input)
    assert.notInclude(result, '<object')
    assert.notInclude(result, '<embed')
  })

  test('should preserve table elements', ({ assert }) => {
    const input = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>'
    const result = sanitizeHtml(input)
    assert.include(result, '<table>')
    assert.include(result, '<thead>')
    assert.include(result, '<tbody>')
    assert.include(result, '<tr>')
    assert.include(result, '<th>')
    assert.include(result, '<td>')
  })

  test('should preserve list elements', ({ assert }) => {
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul>'
    const result = sanitizeHtml(input)
    assert.include(result, '<ul>')
    assert.include(result, '<li>')
  })
})

test.group('sanitize.ts - sanitizePlainText', () => {
  test('should only allow basic formatting tags', ({ assert }) => {
    const input = '<p>Hello <strong>world</strong> <em>italic</em></p>'
    const result = sanitizePlainText(input)
    assert.include(result, '<p>')
    assert.include(result, '<strong>')
    assert.include(result, '<em>')
  })

  test('should strip links', ({ assert }) => {
    const input = '<a href="https://example.com">Link</a>'
    const result = sanitizePlainText(input)
    assert.notInclude(result, '<a')
    assert.include(result, 'Link')
  })

  test('should strip images', ({ assert }) => {
    const input = '<img src="test.png" alt="Test">'
    const result = sanitizePlainText(input)
    assert.notInclude(result, '<img')
  })

  test('should strip tables', ({ assert }) => {
    const input = '<table><tr><td>Cell</td></tr></table>'
    const result = sanitizePlainText(input)
    assert.notInclude(result, '<table')
    assert.include(result, 'Cell')
  })
})

test.group('sanitize.ts - stripHtml', () => {
  test('should return empty string for null/undefined input', ({ assert }) => {
    assert.equal(stripHtml(null as unknown as string), '')
    assert.equal(stripHtml(undefined as unknown as string), '')
    assert.equal(stripHtml(''), '')
  })

  test('should remove all HTML tags', ({ assert }) => {
    const input = '<p>Hello <strong>world</strong></p>'
    const result = stripHtml(input)
    assert.equal(result, 'Hello world')
  })

  test('should handle complex nested HTML', ({ assert }) => {
    const input = '<div><p><a href="test">Link <strong>text</strong></a></p></div>'
    const result = stripHtml(input)
    assert.equal(result, 'Link text')
  })

  test('should strip script content', ({ assert }) => {
    const input = '<p>Text</p><script>alert("xss")</script>'
    const result = stripHtml(input)
    assert.notInclude(result, 'alert')
    assert.notInclude(result, 'script')
  })
})

test.group('sanitize.ts - sanitizeUrl', () => {
  test('should return empty string for null/undefined input', ({ assert }) => {
    assert.equal(sanitizeUrl(null as unknown as string), '')
    assert.equal(sanitizeUrl(undefined as unknown as string), '')
    assert.equal(sanitizeUrl(''), '')
  })

  test('should return empty string for non-string input', ({ assert }) => {
    assert.equal(sanitizeUrl(123 as unknown as string), '')
  })

  test('should block javascript: protocol', ({ assert }) => {
    assert.equal(sanitizeUrl('javascript:alert(1)'), '')
    assert.equal(sanitizeUrl('JAVASCRIPT:alert(1)'), '')
    assert.equal(sanitizeUrl('  javascript:alert(1)  '), '')
  })

  test('should block data: protocol', ({ assert }) => {
    assert.equal(sanitizeUrl('data:text/html,<script>alert(1)</script>'), '')
  })

  test('should block vbscript: protocol', ({ assert }) => {
    assert.equal(sanitizeUrl('vbscript:msgbox(1)'), '')
  })

  test('should block file: protocol', ({ assert }) => {
    assert.equal(sanitizeUrl('file:///etc/passwd'), '')
  })

  test('should allow http:// URLs', ({ assert }) => {
    const url = 'http://example.com/page'
    assert.equal(sanitizeUrl(url), url)
  })

  test('should allow https:// URLs', ({ assert }) => {
    const url = 'https://example.com/page?query=1'
    assert.equal(sanitizeUrl(url), url)
  })

  test('should allow mailto: URLs', ({ assert }) => {
    const url = 'mailto:user@example.com'
    assert.equal(sanitizeUrl(url), url)
  })

  test('should allow tel: URLs', ({ assert }) => {
    const url = 'tel:+33123456789'
    assert.equal(sanitizeUrl(url), url)
  })

  test('should allow relative URLs starting with /', ({ assert }) => {
    assert.equal(sanitizeUrl('/path/to/page'), '/path/to/page')
  })

  test('should allow anchor URLs starting with #', ({ assert }) => {
    assert.equal(sanitizeUrl('#section'), '#section')
  })

  test('should allow relative URLs without protocol', ({ assert }) => {
    assert.equal(sanitizeUrl('path/to/page'), 'path/to/page')
    assert.equal(sanitizeUrl('page.html'), 'page.html')
  })

  test('should block unknown protocols', ({ assert }) => {
    assert.equal(sanitizeUrl('ftp://example.com'), '')
    assert.equal(sanitizeUrl('custom://something'), '')
  })
})
