import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { address } from './address'
import { buildAssistantGreeting } from './greetings'
import { formatColleagueName } from './colleagueAddress'
import { formatNotification } from './notifications'

const user = {
  firstName: 'Gökhan',
  lastName: 'Yılmaz',
  title: 'Dr.' as const,
  gender: 'male' as const,
  addressingPreference: 'named_hocam' as const,
}

describe('address', () => {
  it('casual returns Hocam by default', () => {
    assert.equal(address({ ...user, addressingPreference: 'named_hocam' }, 'casual'), 'Hocam')
    assert.equal(address({ ...user, addressingPreference: 'hocam' }, 'casual'), 'Hocam')
    assert.equal(address({ ...user, addressingPreference: 'first_name_only' }, 'casual'), 'Gökhan')
  })

  it('named respects preference', () => {
    assert.equal(address(user, 'named'), 'Gökhan Hocam')
    assert.equal(address({ ...user, addressingPreference: 'hocam' }, 'named'), 'Hocam')
    assert.equal(address({ ...user, addressingPreference: 'first_name_only' }, 'named'), 'Gökhan')
  })

  it('formal uses gender suffix', () => {
    assert.equal(address(user, 'formal'), 'Gökhan Bey')
    assert.equal(address({ ...user, gender: 'female' }, 'formal'), 'Gökhan Hanım')
  })

  it('written includes title and name', () => {
    assert.equal(address(user, 'written'), 'Dr. Gökhan Yılmaz')
  })

  it('referral uses Sayın prefix', () => {
    assert.equal(address(user, 'referral'), 'Sayın Gökhan Hocam')
  })

  it('notification respects preference', () => {
    assert.equal(address(user, 'notification'), 'Gökhan Hocam')
    assert.equal(address({ ...user, addressingPreference: 'hocam' }, 'notification'), 'Hocam')
  })
})

describe('buildAssistantGreeting', () => {
  it('includes patient count when provided', () => {
    assert.equal(
      buildAssistantGreeting(user, { patientCount: 3, timeOfDay: 'morning' }),
      'Gökhan Hocam, bugün 3 hastanız var'
    )
  })

  it('uses time greeting', () => {
    assert.equal(
      buildAssistantGreeting({ ...user, addressingPreference: 'hocam' }, { timeOfDay: 'morning' }),
      'Günaydın hocam'
    )
  })
})

describe('formatColleagueName', () => {
  it('strips title and adds Hocam', () => {
    assert.equal(formatColleagueName('Prof. Dr. Ayşe Kaya'), 'Ayşe Hocam')
  })
})

describe('formatNotification', () => {
  it('prefixes message with addressing', () => {
    assert.equal(formatNotification(user, 'notunuz hazır'), 'Gökhan Hocam, notunuz hazır')
  })
})
