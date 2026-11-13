import {DocumentPdfIcon} from '@sanity/icons/DocumentPdf'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {catalogoFields} from './catalogoFields'

export default defineType({
  name: 'officialDocument',
  title: 'Documento Oficial',
  icon: DocumentPdfIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título del documento',
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
      name: 'description',
      title: 'Descripción / Resumen normativo',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(500),
    }),
    defineField({
      name: 'category',
      title: 'Tipo o categoría normativa',
      type: 'string',
      options: {
        list: [
          {title: 'Protocolo (Protocol)', value: 'protocol'},
          {title: 'Reglamento (Regulation)', value: 'regulation'},
          {title: 'Estatuto (Statutes)', value: 'statutes'},
          {title: 'Resolución (Resolution)', value: 'resolution'},
          {title: 'Circular (Circular)', value: 'circular'},
          {title: 'Acta (Minutes)', value: 'minutes'},
          {title: 'Otro (Other)', value: 'other'},
        ],
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'protocol',
    }),
    defineField({
      name: 'file',
      title: 'Archivo PDF',
      type: 'file',
      options: {accept: '.pdf,application/pdf'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publicationDate',
      title: 'Fecha de publicación oficial',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'effectiveDate',
      title: 'Fecha de entrada en vigencia',
      type: 'date',
    }),
    defineField({
      name: 'version',
      title: 'Versión o edición',
      description: 'Ejemplo: "Edición 2026", "v1.2".',
      type: 'string',
    }),
    defineField({
      name: 'status',
      title: 'Estado de vigencia',
      description: 'Alimenta la insignia "Vigente" en el sitio público.',
      type: 'string',
      options: {
        list: [
          {title: 'Vigente (Current)', value: 'current'},
          {title: 'Reemplazado / Superado (Superseded)', value: 'superseded'},
          {title: 'Derogado / Obsoleto (Repealed)', value: 'repealed'},
        ],
        layout: 'radio',
      },
      initialValue: 'current',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'owner',
      title: 'Unidad u órgano responsable',
      description: 'Dejar vacío si el documento pertenece directamente a la Federación (se mostrará "FECHITAT").',
      type: 'reference',
      to: [{type: 'organizationUnit'}],
    }),
    defineField({
      name: 'relatedUnits',
      title: 'Otras unidades u órganos vinculados',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'organizationUnit'}],
        }),
      ],
    }),
    defineField({
      name: 'order',
      title: 'Orden de aparición',
      type: 'number',
      initialValue: 0,
    }),
    ...catalogoFields,
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      version: 'version',
      status: 'status',
    },
    prepare({title, category, version, status}) {
      const categoryLabels: Record<string, string> = {
        protocol: 'Protocolo',
        regulation: 'Reglamento',
        statutes: 'Estatuto',
        resolution: 'Resolución',
        circular: 'Circular',
        minutes: 'Acta',
        other: 'Otro',
      }
      const statusLabels: Record<string, string> = {
        current: 'Vigente',
        superseded: 'Reemplazado',
        repealed: 'Derogado',
      }
      const subtitle = [
        categoryLabels[category] || category || 'Documento',
        version || null,
        statusLabels[status] || status || 'Vigente',
      ]
        .filter(Boolean)
        .join(' · ')
      return {
        title,
        subtitle,
      }
    },
  },
  orderings: [
    {
      title: 'Fecha de publicación (más reciente)',
      name: 'pubDateDesc',
      by: [{field: 'publicationDate', direction: 'desc'}],
    },
    {
      title: 'Orden manual',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
})
