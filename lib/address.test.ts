import assert from 'node:assert/strict'
import test from 'node:test'
import { address } from './address'
import { buildAssistantGreeting } from './greetings'
import { formatColleagueName } from './colleagueAddress'
import { formatNotification } from './notifications'

const gokhan = {
  firstName: 'Gökhan',
  lastName: 'Yılmaz',
  title: 'Uzm. Dr.' as const,
  gender: 'male' as const,
}

test('address casual default is Hocam', () => {
  assert.equal(address(gokhan, 'casual'), 'Hocam')
})

test('address named uses firstName Hocam', () => {
  assert.equal(address(gokhan, 'named'), 'Gökhan Hocam')
})

test('address formal uses Bey/Hanım', () => {
  assert.equal(address(gokhan, 'formal'), 'Gökhan Bey')
  assert.equal(address({ ...gokhan, gender: 'female' }, 'formal'), 'Gökhan Hanım')
})

test('address written includes title and name', () => {
  assert.equal(address(gokhan, 'written'), 'Uzm. Dr. Gökhan Yılmaz')
})

test('address referral format', () => {
  assert.equal(address(gokhan, 'referral'), 'Sayın Gökhan Hocam')
})

test('first_name_only preference', () => {
  const user = { ...gokhan, addressingPreference: 'first_name_only' as const }
  assert.equal(address(user, 'casual'), 'Gökhan')
  assert.equal(address(user, 'named'), 'Gökhan')
  assert.equal(address(user, 'referral'), 'Sayın Gökhan')
})

test('hocam preference keeps casual as Hocam', () => {
  const user = { ...gokhan, addressingPreference: 'hocam' as const }
  assert.equal(address(user, 'casual'), 'Hocam')
  assert.equal(address(user, 'named'), 'Gökhan Hocam')
})

test('buildAssistantGreeting morning', () => {
  const msg = buildAssistantGreeting(gokhan, { timeOfDay: 'morning' })
  assert.match(msg, /Günaydın hocam/i)
})

test('buildAssistantGreeting with patient count', () => {
  const msg = buildAssistantGreeting(gokhan, { patientCount: 3 })
  assert.equal(msg, 'Gökhan Hocam, bugün 3 hastanız var')
})

test('formatColleagueName strips title', () => {
  assert.equal(formatColleagueName('Prof. Dr. Ayşe Kaya'), 'Ayşe Hocam')
})

test('formatNotification prefixes message', () => {
  const msg = formatNotification(gokhan, 'Notunuz hazır')
  assert.equal(msg, 'Gökhan Hocam, notunuz hazır')
})
