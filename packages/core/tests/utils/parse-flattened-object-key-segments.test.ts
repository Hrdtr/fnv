import { describe, expect, it } from 'vitest'
import { parseFlattenedObjectKeySegments } from '../../src/utils'

describe('parseFlattenedObjectKeySegments', () => {
  it('should parse a simple path', () => {
    expect(parseFlattenedObjectKeySegments('a.b.c')).toEqual(['a', 'b', 'c'])
  })

  it('should parse a path with array indices', () => {
    expect(parseFlattenedObjectKeySegments('a[0].b[1].c')).toEqual(['a', 0, 'b', 1, 'c'])
  })

  it('should parse a path with mixed segments', () => {
    expect(parseFlattenedObjectKeySegments('a.b[0].c[1].d')).toEqual(['a', 'b', 0, 'c', 1, 'd'])
  })

  it('should parse a path with only array indices', () => {
    expect(parseFlattenedObjectKeySegments('[0][1][2]')).toEqual([0, 1, 2])
  })

  it('should parse a path with empty string', () => {
    expect(parseFlattenedObjectKeySegments('')).toEqual([])
  })

  it('should parse a path with special characters in key names', () => {
    expect(parseFlattenedObjectKeySegments('a.b-c.d_e')).toEqual(['a', 'b-c', 'd_e'])
  })

  it('should parse a path with leading and trailing dots', () => {
    expect(parseFlattenedObjectKeySegments('.a.b.')).toEqual(['a', 'b'])
  })

  it('should parse a path with consecutive dots', () => {
    expect(parseFlattenedObjectKeySegments('a..b')).toEqual(['a', 'b'])
  })

  it('should parse a path with escaped characters', () => {
    expect(parseFlattenedObjectKeySegments('a\\.b.c')).toEqual(['a.b', 'c'])
  })
})
