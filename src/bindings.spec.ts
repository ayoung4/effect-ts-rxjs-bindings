import * as T from '@effect-ts/core/Effect'
import * as S from '@effect-ts/core/Effect/Stream'
import { pipe } from '@effect-ts/core/Function'
import { Observable } from 'rxjs'

import { embed, epic } from './bindings'

describe('bindings', () => {

  interface Init { type: 'init' }

  interface Done { type: 'done' }

  const Done: Done = { type: 'done' }

  interface Dep { a: { type: 'done' } }

  const e = epic<Init, {}, Done>()(
    (actions) => pipe(
      actions,
      S.mapM(() =>
        T.access((dep: Dep) => dep.a)
      )
    )
  )

  const dep: Dep = { a: { type: 'done' } }

  const provideDep = T.provide({ a: Done })

  describe('embed', () => {

    it('embeds trivial example', async () => {

      const [o] = embed(e)(provideDep)

      const action$ = new Observable<Init>((subscriber) => {
        subscriber.next({ type: 'init' })
        subscriber.complete()
      })

      const state$ = new Observable<{}>((subscriber) => {
        subscriber.next({})
        subscriber.complete()
      })

      const vals: Done[] = []

      await o(action$, state$).forEach((a) => {
        vals.push(a)
      })

      expect(vals).toEqual([Done])

    })

  })

})