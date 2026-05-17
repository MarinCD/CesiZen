"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, Square } from "lucide-react"

interface Exercise {
  id: string
  name: string
  description: string
  phases: { label: string; duration: number; type: "expand" | "hold" | "shrink" | "hold-low" }[]
  totalCycles: number
}

const EXERCISES: Exercise[] = [
  {
    id: "coherence",
    name: "Cohérence cardiaque",
    description: "5 secondes d'inspiration, 5 secondes d'expiration. Idéal 3 fois par jour.",
    totalCycles: 30,
    phases: [
      { label: "Inspirez", duration: 5, type: "expand" },
      { label: "Expirez", duration: 5, type: "shrink" },
    ],
  },
  {
    id: "box",
    name: "Box Breathing",
    description: "Technique utilisée par les Navy SEALs pour gérer le stress sous pression.",
    totalCycles: 10,
    phases: [
      { label: "Inspirez", duration: 4, type: "expand" },
      { label: "Retenez", duration: 4, type: "hold" },
      { label: "Expirez", duration: 4, type: "shrink" },
      { label: "Retenez", duration: 4, type: "hold-low" },
    ],
  },
  {
    id: "478",
    name: "Relaxation 4-7-8",
    description: "Technique du Dr Andrew Weil pour une relaxation profonde et l'endormissement.",
    totalCycles: 8,
    phases: [
      { label: "Inspirez", duration: 4, type: "expand" },
      { label: "Retenez", duration: 7, type: "hold" },
      { label: "Expirez", duration: 8, type: "shrink" },
    ],
  },
]

const ANIMATION_CLASS: Record<string, string> = {
  expand: "animate-breathe-expand",
  hold: "animate-breathe-hold",
  shrink: "animate-breathe-shrink",
  "hold-low": "animate-breathe-hold-low",
}

export function BreathingExercise() {
  const [selectedId, setSelectedId] = useState("coherence")
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [cyclesDone, setCyclesDone] = useState(0)
  const [totalTime, setTotalTime] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const exercise = EXERCISES.find((e) => e.id === selectedId)!

  const totalDuration = exercise.phases.reduce((s, p) => s + p.duration, 0) * exercise.totalCycles

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    setPaused(false)
    setPhaseIndex(0)
    setTimeLeft(0)
    setCyclesDone(0)
    setTotalTime(0)
  }, [])

  const start = () => {
    setRunning(true)
    setPaused(false)
    setPhaseIndex(0)
    setTimeLeft(exercise.phases[0].duration)
    setCyclesDone(0)
    setTotalTime(totalDuration)
  }

  useEffect(() => {
    if (!running || paused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // passer à la prochaine phase
          setPhaseIndex((pIdx) => {
            const nextPhase = (pIdx + 1) % exercise.phases.length
            const completedCycle = nextPhase === 0
            if (completedCycle) {
              setCyclesDone((c) => {
                if (c + 1 >= exercise.totalCycles) {
                  stop()
                  return 0
                }
                return c + 1
              })
            }
            setTimeLeft(exercise.phases[nextPhase].duration)
            return nextPhase
          })
          return exercise.phases[0].duration
        }
        setTotalTime((t) => Math.max(0, t - 1))
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, paused, exercise, stop])

  const currentPhase = exercise.phases[phaseIndex]
  const animClass = running && !paused ? ANIMATION_CLASS[currentPhase.type] : ""
  const animDuration = currentPhase?.duration ?? 5

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="space-y-6">
      {/* Sélection exercice */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Choisir un exercice">
        {EXERCISES.map((ex) => (
          <button
            key={ex.id}
            role="radio"
            aria-checked={selectedId === ex.id}
            onClick={() => { if (!running) { setSelectedId(ex.id); stop() } }}
            disabled={running}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedId === ex.id
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <div className="font-semibold text-sm mb-1">{ex.name}</div>
            <div className="text-xs text-muted-foreground">{ex.description}</div>
          </button>
        ))}
      </div>

      {/* Animation */}
      <div className="flex flex-col items-center justify-center py-8 space-y-6" aria-live="polite" aria-atomic="true">
        <div className="relative flex items-center justify-center">
          {/* Cercle animé */}
          <div
            className={`w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 opacity-80 flex items-center justify-center shadow-lg ${animClass}`}
            style={{ "--duration": `${animDuration}s` } as React.CSSProperties}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <span className="text-xl font-bold">
              {running ? currentPhase.label : exercise.phases[0].label}
            </span>
            {running && (
              <span className="text-3xl font-mono font-bold mt-1">{timeLeft}</span>
            )}
          </div>
        </div>

        {/* Stats */}
        {running && (
          <div className="flex gap-8 text-center text-sm text-muted-foreground">
            <div>
              <div className="font-semibold text-foreground">{cyclesDone}/{exercise.totalCycles}</div>
              <div>cycles</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">{formatTime(totalTime)}</div>
              <div>restant</div>
            </div>
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="flex justify-center gap-3">
        {!running ? (
          <Button size="lg" onClick={start} className="px-8">
            <Play className="h-5 w-5 mr-2" aria-hidden="true" />
            Démarrer
          </Button>
        ) : (
          <>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? (
                <><Play className="h-5 w-5 mr-2" aria-hidden="true" />Reprendre</>
              ) : (
                <><Pause className="h-5 w-5 mr-2" aria-hidden="true" />Pause</>
              )}
            </Button>
            <Button size="lg" variant="destructive" onClick={stop}>
              <Square className="h-5 w-5 mr-2" aria-hidden="true" />
              Arrêter
            </Button>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Phases : {exercise.phases.map((p) => `${p.label} ${p.duration}s`).join(" → ")}</p>
        <p className="mt-1">{exercise.totalCycles} cycles · durée totale : {formatTime(totalDuration)}</p>
      </div>
    </div>
  )
}
