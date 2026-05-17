import { Role } from "@prisma/client"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
}

export interface InformationWithCreateur {
  id: number
  titre: string
  texte: string
  categorie: string | null
  datePublication: Date | null
  idCreateur: number
  createur: {
    nom: string | null
    prenom: string | null
  }
}

export interface ResultatDiagnosticWithDiagnostic {
  id: number
  dateRealisation: Date
  score: number
  interpretation: string | null
  utilisateurId: number
  diagnosticId: number
  diagnostic: {
    nom: string
  }
}

export interface TrackerEmotionEntry {
  id: number
  emotion: string
  intensite: number
  note: string | null
  date: Date
  utilisateurId: number
}

export interface QuestionWithPoints {
  id: number
  texte: string
  pointsAssocies: number
}

export type ScoreInterpretation = "FAIBLE" | "MODERE" | "ELEVE"
