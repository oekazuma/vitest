import { access } from 'fs'
import { sep } from 'pathe'
import { A } from '../src/sourceA'

test('A equeals A', () => {
  expect(A).toBe('A')
  expect(typeof sep).toBe('string')
  // doesnt throw
  expect(typeof access).toBe('function')
})
