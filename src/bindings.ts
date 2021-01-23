import * as T from '@effect-ts/core/Effect'
import * as S from '@effect-ts/core/Effect/Stream'
import { pipe } from '@effect-ts/core/Function'
import * as NEA from '@effect-ts/core/NonEmptyArray'
import { Observable } from 'rxjs'
import { encaseObservable, runToObservable, toObservable } from './rxjs'

export interface RxJsEpic<A, S, O = A> {
  (action$: Observable<A>, state$: Observable<S>): Observable<O>
}

export interface Epic<R, A, S, O = A> {
  _R: R
  _A: A
  _S: S
  _O: O
  (action: S.UIO<A>, state: S.UIO<S>): S.RIO<R, O>
}

type AnyEpic = Epic<any, any, any, any> | Epic<never, any, any, any>

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type CombinedEnv<Epics extends NEA.NonEmptyArray<AnyEpic>> =
  UnionToIntersection<Epics[number]['_R']>

type CombinedActions<Epics extends NEA.NonEmptyArray<AnyEpic>> =
  Epics[number]['_A']

type CombinedState<Epics extends NEA.NonEmptyArray<AnyEpic>> =
  UnionToIntersection<Epics[number]['_S']>

type CombinedOutputs<Epics extends NEA.NonEmptyArray<AnyEpic>> =
  Epics[number]['_O']

function toNever(_: any): never {
  return undefined as never;
};

export function embed<Epics extends NEA.NonEmptyArray<AnyEpic>>(
  ...epics: Epics
): (
    provider: (
      _: T.Effect<CombinedEnv<Epics>, never, unknown>
    ) => T.Effect<T.DefaultEnv, never, unknown>
  ) => NEA.NonEmptyArray<RxJsEpic<
    CombinedActions<Epics>,
    CombinedState<Epics>,
    CombinedOutputs<Epics>
  >> {
  return (provider) => pipe(
    epics,
    NEA.map((ep) => (action$, state$) =>
      pipe(
        toObservable(
          ep(
            encaseObservable(action$, toNever),
            encaseObservable(state$, toNever),
          ),
        ),
        provider,
        runToObservable,
      )
    )
  )
}

export function epic<A, S, O = A>(): <R>(
  fn: (action: S.UIO<A>, state: S.UIO<S>) => S.RIO<R, O>
) => Epic<R, A, S, O> {
  return (fn) => fn as any
}
