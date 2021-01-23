import * as T from '@effect-ts/core/Effect'
import * as C from '@effect-ts/core/Effect/Cause'
import * as Ex from '@effect-ts/core/Effect/Exit'
import * as S from '@effect-ts/core/Effect/Stream'
import { pipe } from '@effect-ts/core/Function'
import * as O from '@effect-ts/core/Option'
import { Observable } from 'rxjs'

export function encaseObservable<E, A>(
  observable: Observable<A>,
  onError: (e: unknown) => E,
): S.IO<E, A> {
  return S.effectAsync(
    (cb) => {
      observable.forEach(
        (a) => cb(
          T.succeed([a])
        )
      ).then(
        () => cb(
          T.fail(O.none)
        ),
        (e) => pipe(
          e,
          onError,
          O.some,
          T.fail,
          cb
        )
      )
    }
  )
}

export function runToObservable<A>(
  t: T.UIO<Observable<A>>
): Observable<A> {
  return new Observable(
    (subscriber) => {
      T.run(
        t,
        Ex.fold(
          C.fold(
            // TODO
            // not sure what to do here
            () => subscriber.complete(),
            (e) => subscriber.error(e),
            () => subscriber.complete(),
            () => subscriber.complete(),
            () => subscriber.complete(),
            () => subscriber.complete(),
            () => subscriber.complete(),
          ),
          (inner) => {
            inner.forEach(
              (a) => subscriber.next(a)
            ).then(
              () => subscriber.complete(),
              (e) => subscriber.error(e),
            )
          }
        )
      )
    }
  )
}

export function toObservable<R, E, A>(
  s: S.Stream<R, E, A>
): T.RIO<R, Observable<A>> {
  return T.access((r) =>
    new Observable(
      (subscriber) => {

        const drain = pipe(
          s,
          S.mapM((a) =>
            T.effectTotal(() => {
              subscriber.next(a)
            })
          ),
          S.runDrain,
          T.provide(r),
        )

        T.run(
          drain,
          Ex.fold(
            C.fold(
              // TODO
              // not sure what to do here
              () => subscriber.complete(),
              (e) => subscriber.error(e),
              () => subscriber.complete(),
              () => subscriber.complete(),
              () => subscriber.complete(),
              () => subscriber.complete(),
              () => subscriber.complete(),
            ),
            () => {
              subscriber.complete()
            }
          )
        )

      }
    )
  )
}