// Nuevos esquemas informativos normalizados
import federation from './federation'
import person from './person'
import organizationUnit from './organizationUnit'
import club from './club'
import recognition from './recognition'
import officialDocument from './officialDocument'
import event from './event'
import post from './post'
import historicalMilestone from './historicalMilestone'

// Patrimonio institucional
import testimonio from './testimonio'

// Esquemas educativos (Frontera formativa - no tocar)
import glosarioTermino from './glosarioTermino'
import programaExamen from './programaExamen'
import materialEstudio from './materialEstudio'
import recurso from './recurso'

// Esquemas legados (Coexistencia en Archivo Legado durante migración)
import miembroOrganigrama from './miembroOrganigrama'
import comision from './comision'
import escuela from './escuela'
import documentoOficial from './documentoOficial'
import evento from './evento'
import blogPost from './blogPost'
import hitoHistorico from './hitoHistorico'
import metrica from './metrica'
import campeon from './campeon'
import competidor from './competidor'
import camiseta from './camiseta'

export const schemaTypes = [
  // 1. Nuevos tipos informativos
  federation,
  person,
  organizationUnit,
  club,
  recognition,
  officialDocument,
  event,
  post,
  historicalMilestone,

  // 2. Patrimonio institucional
  testimonio,

  // 3. Dominio educativo (Formación)
  glosarioTermino,
  programaExamen,
  materialEstudio,
  recurso,

  // 4. Archivo legado (migración)
  miembroOrganigrama,
  comision,
  escuela,
  documentoOficial,
  evento,
  blogPost,
  hitoHistorico,
  metrica,
  campeon,
  competidor,
  camiseta,
]
