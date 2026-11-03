import { getResourceCategory, type CatalogResource } from './catalogo.ts';

// Estos destinos ya existían en Recursos y mantienen sus funcionalidades independientes.
export const LOCAL_RESOURCES: CatalogResource[] = [
  {
    id: 'programa-examen',
    isFundamental: true,
    title: 'Programa de examen',
    description: 'Requisitos por cinturón para exámenes: posiciones, técnicas, tuls, combate, roturas y teoría.',
    href: '/recursos/formacion/programa-examen',
    category: getResourceCategory('teoria'),
    format: 'documento',
    keywords: ['grados', 'cinturones', 'requisitos', 'estudio', 'pdf'],
    actionLabel: 'Ver programa',
  },
  {
    id: 'terminologia',
    isFundamental: true,
    title: 'Terminología',
    description: 'Diccionario de Taekwon-Do ITF en español, inglés y coreano con buscador rápido.',
    href: '/recursos/formacion/terminologia',
    category: getResourceCategory('teoria'),
    format: 'guia',
    keywords: ['diccionario', 'vocabulario', 'idiomas', 'estudio', 'coreano'],
    actionLabel: 'Ver diccionario',
  },
  {
    id: 'temporizador-formas',
    isFundamental: true,
    title: 'Temporizador de formas',
    description: 'Cronómetro oficial de Tuls con límites reglamentarios ITF, cuenta regresiva y metrónomo.',
    href: '/recursos/formacion/temporizador',
    category: getResourceCategory('formas'),
    format: 'herramienta',
    keywords: ['tiempo', 'entrenamiento', 'tul', 'formas', 'cronometro'],
    actionLabel: 'Abrir temporizador',
  },
  {
    id: 'teoria-examen',
    isFundamental: true,
    title: 'Teoría de examen',
    description: 'Manual oficial de teoría FECHITAT: historia, principios, dojang, puntos vitales y teoría del poder.',
    href: '/recursos/formacion/teoria',
    category: getResourceCategory('teoria'),
    format: 'documento',
    keywords: ['manual', 'teoria', 'pdf', 'examen'],
    actionLabel: 'Ver teoría',
  },
];
