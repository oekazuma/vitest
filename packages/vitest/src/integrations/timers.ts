/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of https://github.com/facebook/jest.
 */

import type {
  FakeTimerWithContext,
  InstalledClock,
} from '@sinonjs/fake-timers'
import {
  withGlobal,
} from '@sinonjs/fake-timers'
import MockDate from 'mockdate'

export class FakeTimers {
  private _clock!: InstalledClock
  private _fakingTime: boolean
  private _fakingDate: boolean
  private _fakeTimers: FakeTimerWithContext
  private _maxLoops: number
  private _now = Date.now

  constructor({
    global,
    maxLoops = 10_000,
  }: {
    global: typeof globalThis
    maxLoops?: number
  }) {
    this._maxLoops = maxLoops

    this._fakingDate = false

    this._fakingTime = false
    this._fakeTimers = withGlobal(global)
  }

  clearAllTimers(): void {
    if (this._fakingTime)
      this._clock.reset()
  }

  dispose(): void {
    this.useRealTimers()
  }

  runAllTimers(): void {
    if (this._checkFakeTimers())
      this._clock.runAll()
  }

  runOnlyPendingTimers(): void {
    if (this._checkFakeTimers())
      this._clock.runToLast()
  }

  advanceTimersToNextTimer(steps = 1): void {
    if (this._checkFakeTimers()) {
      for (let i = steps; i > 0; i--) {
        this._clock.next()
        // Fire all timers at this point: https://github.com/sinonjs/fake-timers/issues/250
        this._clock.tick(0)

        if (this._clock.countTimers() === 0)
          break
      }
    }
  }

  advanceTimersByTime(msToRun: number): void {
    if (this._checkFakeTimers())
      this._clock.tick(msToRun)
  }

  runAllTicks(): void {
    if (this._checkFakeTimers()) {
      // @ts-expect-error method not exposed
      this._clock.runMicrotasks()
    }
  }

  useRealTimers(): void {
    if (this._fakingDate) {
      MockDate.reset()
      this._fakingDate = false
    }

    if (this._fakingTime) {
      this._clock.uninstall()
      this._fakingTime = false
    }
  }

  useFakeTimers(): void {
    if (this._fakingDate) {
      throw new Error(
        '"setSystemTime" was called already and date was mocked. Reset timers using `vi.useRealTimers()` if you want to use fake timers again.',
      )
    }

    if (!this._fakingTime) {
      const toFake = Object.keys(this._fakeTimers.timers) as Array<keyof FakeTimerWithContext['timers']>

      this._clock = this._fakeTimers.install({
        loopLimit: this._maxLoops,
        now: Date.now(),
        toFake,
        shouldClearNativeTimers: true,
      })

      this._fakingTime = true
    }
  }

  reset(): void {
    if (this._checkFakeTimers()) {
      const { now } = this._clock
      this._clock.reset()
      this._clock.setSystemTime(now)
    }
  }

  setSystemTime(now?: number | Date): void {
    if (this._fakingTime) {
      this._clock.setSystemTime(now)
    }
    else {
      MockDate.set(now ?? this.getRealSystemTime())
      this._fakingDate = true
    }
  }

  getRealSystemTime(): number {
    return this._now()
  }

  getTimerCount(): number {
    if (this._checkFakeTimers())
      return this._clock.countTimers()

    return 0
  }

  private _checkFakeTimers() {
    if (!this._fakingTime) {
      throw new Error(
        'Timers are not mocked. Try calling "vi.useFakeTimers()" first.',
      )
    }

    return this._fakingTime
  }
}
