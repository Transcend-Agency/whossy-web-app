import { describe, expect, it } from 'vitest'
import { PASSWORD_RULES, meetsPasswordRules } from './passwordRules'

describe('the reset password rules', () => {
    it('accepts a password that ticks every box', () => expect(meetsPasswordRules('Whossy#2026')).toBe(true))

    it('refuses one with no uppercase letter, as the checklist says', () =>
        expect(meetsPasswordRules('whossy#2026')).toBe(false))

    it('refuses one with no lowercase letter', () => expect(meetsPasswordRules('WHOSSY#2026')).toBe(false))

    it('does not count a space as a special character', () => expect(meetsPasswordRules('Whossy 2026')).toBe(false))

    it('accepts a long password', () => expect(meetsPasswordRules('Aa1!' + 'x'.repeat(40))).toBe(true))

    it('ticks each checklist line on its own', () =>
        expect(PASSWORD_RULES.map((rule) => rule.test('Ab1'))).toEqual([false, true, true, false]))
})
