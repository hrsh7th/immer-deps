import { matches, getIn } from '../src';

describe('utils', () => {

  it('matches', () => {
    expect(matches(
      ['tasks', Number],
      ['tasks', 0]
    )).toHaveLength(2);
  });

  it('getIn', () => {
    expect(getIn({
      key1: {
        key2: {
          key3: 1
        }
      }
    }, ['key1', 'key2', 'key3'])).toBe(1);
  });

});
