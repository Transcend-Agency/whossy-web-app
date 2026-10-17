import { describe, expect, it } from 'vitest'

// The split used by both Google sign-in handlers, kept here so the cases that
// used to throw are pinned down.
const splitName = (displayName: string | null | undefined) => {
    const [firstName = '', ...rest] = displayName?.split(' ') ?? []
    return { firstName, lastName: rest.join(' ') }
}

describe('splitting a Google display name', () => {
    it('splits first and last', () => expect(splitName('Ada Obi')).toEqual({ firstName: 'Ada', lastName: 'Obi' }))
    it('keeps a multi-part surname together', () => expect(splitName('Ada van der Berg')).toEqual({ firstName: 'Ada', lastName: 'van der Berg' }))
    it('handles a one-word name', () => expect(splitName('Madonna')).toEqual({ firstName: 'Madonna', lastName: '' }))
    it('handles an empty or missing name', () => {
        expect(splitName('')).toEqual({ firstName: '', lastName: '' })
        expect(splitName(null)).toEqual({ firstName: '', lastName: '' })
    })
})
