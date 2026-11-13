import {ClockIcon} from '@sanity/icons/Clock'
import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'historicalMilestone',
  title: 'Hito Histórico',
  icon: ClockIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título del hito',
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
      name: 'year',
      title: 'Año',
      description: 'Año en que ocurrió el hito histórico.',
      type: 'number',
      validation: (Rule) => Rule.required().integer().min(1955).max(2100),
    }),
    defineField({
      name: 'date',
      title: 'Fecha exacta (opcional)',
      description: 'Si se conoce mes y día (ej. 2011-06-01 para la fundación). No inventar si no está documentada.',
      type: 'date',
    }),
    defineField({
      name: 'description',
      title: 'Descripción resumida',
      description: 'Texto que se muestra en la línea de tiempo de la página Federación.',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Contenido extendido (opcional)',
      description: 'Detalles adicionales para modal o vista expandida.',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'image',
      title: 'Fotografía histórica o documento de época',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'order',
      title: 'Orden de desempate',
      description: 'Menor número = aparece antes dentro del mismo año o fecha.',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.required().integer(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      year: 'year',
      order: 'order',
      media: 'image',
    },
    prepare({title, year, order, media}) {
      return {
        title,
        subtitle: `${year} (orden: ${order})`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Cronológico oficial (año, fecha, orden)',
      name: 'chronologicalAsc',
      by: [
        {field: 'year', direction: 'asc'},
        {field: 'date', direction: 'asc'},
        {field: 'order', direction: 'asc'},
      ],
    },
  ],
})
