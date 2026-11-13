import {StarIcon} from '@sanity/icons/Star'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'recognition',
  title: 'Reconocimiento / Salón de la Fama',
  icon: StarIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título del reconocimiento o logro',
      description: 'Ejemplo: "Subcampeón Mundial de Combate -63kg", "Ingreso al Salón de la Fama 2026".',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'person',
      title: 'Persona homenajeada',
      type: 'reference',
      to: [{type: 'person'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Tipo de distinción',
      type: 'string',
      options: {
        list: [
          {title: 'Salón de la Fama / Trayectoria (Hall of Fame)', value: 'hallOfFame'},
          {title: 'Campeón / Podio Deportivo', value: 'champion'},
          {title: 'Reconocimiento Especial', value: 'specialRecognition'},
          {title: 'Otro', value: 'other'},
        ],
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'champion',
    }),
    defineField({
      name: 'year',
      title: 'Año',
      type: 'number',
      validation: (Rule) => Rule.required().integer().min(1955).max(2100),
    }),
    defineField({
      name: 'achievement',
      title: 'Descripción del logro o mérito',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'event',
      title: 'Evento asociado (opcional)',
      description: 'Torneo, seminario o ceremonia donde se obtuvo la distinción.',
      type: 'reference',
      to: [{type: 'event'}],
    }),
    defineField({
      name: 'image',
      title: 'Fotografía del momento / galardón',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'order',
      title: 'Orden de aparición',
      type: 'number',
      initialValue: 1,
    }),
    defineField({
      name: 'scope',
      title: 'Alcance geográfico (para cálculo de métricas)',
      description: 'Permite calcular automáticamente récords y medallas internacionales de FECHITAT.',
      type: 'string',
      options: {
        list: [
          {title: 'Mundial (World)', value: 'world'},
          {title: 'Panamericano / Sudamericano', value: 'panamerican'},
          {title: 'Nacional (Chile)', value: 'national'},
          {title: 'Otro', value: 'other'},
        ],
      },
    }),
    defineField({
      name: 'placement',
      title: 'Lugar obtenido en podio (para cálculo de métricas)',
      description: '1 para Oro/Primer lugar, 2 para Plata/Segundo lugar, 3 para Bronce/Tercer lugar.',
      type: 'number',
      validation: (Rule) => Rule.integer().min(1).max(100),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      personName: 'person.name',
      year: 'year',
      type: 'type',
      media: 'image',
    },
    prepare({title, personName, year, type, media}) {
      const typeMap: Record<string, string> = {
        hallOfFame: 'Salón de la Fama',
        champion: 'Campeonato',
        specialRecognition: 'Reconocimiento Especial',
        other: 'Otro',
      }
      const subtitle = [year, typeMap[type] || type, personName].filter(Boolean).join(' · ')
      return {
        title,
        subtitle,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Año más reciente',
      name: 'yearDesc',
      by: [{field: 'year', direction: 'desc'}, {field: 'order', direction: 'asc'}],
    },
  ],
})
