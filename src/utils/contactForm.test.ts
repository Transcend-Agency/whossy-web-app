import { describe, expect, it } from 'vitest'
import { CONTACT_LIMITS, validateContactForm } from './contactForm'

const valid = { name: 'Ada Obi', email: 'ada@example.com', message: 'Hello, I have a question about premium.' }

describe('validating the contact form', () => {
    it('accepts a complete form', () => expect(validateContactForm(valid)).toEqual({}))

    it('flags every empty field', () => {
        const errors = validateContactForm({ name: ' ', email: '', message: '\n' })
        expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name'])
    })

    it('rejects malformed emails', () => {
        for (const email of ['ada', 'ada@', 'ada@example', 'ada @example.com', '@example.com']) {
            expect(validateContactForm({ ...valid, email }).email).toBeDefined()
        }
    })

    it('trims before checking', () => {
        expect(validateContactForm({ ...valid, email: '  ada@example.com  ' })).toEqual({})
        expect(validateContactForm({ ...valid, message: '   short    ' }).message).toBeDefined()
    })

    it('enforces the length limits the rules enforce', () => {
        expect(validateContactForm({ ...valid, name: 'a'.repeat(CONTACT_LIMITS.nameMax + 1) }).name).toBeDefined()
        expect(validateContactForm({ ...valid, message: 'a'.repeat(CONTACT_LIMITS.messageMin - 1) }).message).toBeDefined()
        expect(validateContactForm({ ...valid, message: 'a'.repeat(CONTACT_LIMITS.messageMax + 1) }).message).toBeDefined()
        expect(validateContactForm({ ...valid, message: 'a'.repeat(CONTACT_LIMITS.messageMax) })).toEqual({})
    })
})
