import * as T from '@effect-ts/core/Effect'
import * as S from '@effect-ts/core/Effect/Stream'
import { pipe } from '@effect-ts/core/Function'
import { Observable } from 'rxjs'

import { encaseObservable, runToObservable, toObservable } from './rxjs'

describe('rxjs', () => {

  describe('encaseObservable', () => {

    it('handles trivial observable', async () => {

      const o = new Observable<number>((subscriber) => {
        subscriber.next(42)
        subscriber.complete()
      })

      const encased = encaseObservable(
        o,
        () => 'error',
      )

      const vals: number[] = []

      const drain = pipe(
        encased,
        S.mapM((a) =>
          T.effectTotal(() => {
            vals.push(a)
          })
        ),
        S.runDrain,
      )

      await T.runPromise(drain)

      expect(vals).toEqual([42])

    })

  })

  describe('toObservable', () => {

    it('encases UIO', async () => {

      const s = S.fromIterable([42])

      const t = toObservable(s)

      const o = await T.runPromise(t)

      const vals: number[] = []

      await o.forEach((a) => {
        vals.push(a)
      })

      expect(vals).toEqual([42])

    })

  })

  describe('runToObservable', () => {

    it('handles next', async () => {

      const t = T.effectTotal(() =>
        new Observable<number>((subscriber) => {
          subscriber.next(42)
          subscriber.complete()
        })
      )

      const o = runToObservable(t)

      const vals: number[] = []

      await o.forEach((a) => {
        vals.push(a)
      })

      expect(vals).toEqual([42])

    })

  })

})