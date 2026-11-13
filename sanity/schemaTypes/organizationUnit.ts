import {UsersIcon} from '@sanity/icons/Users'
import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'organizationUnit',
  title: 'Unidad Organizacional',
  icon: UsersIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre de la unidad',
      description: 'Ejemplo: Directorio Oficial, Comisión de Disciplina, Coordinador DPC.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Tipo de unidad',
      type: 'string',
      options: {
        list: [
          {title: 'Directorio Oficial (Board)', value: 'board'},
          {title: 'Comisión permanente (Commission)', value: 'commission'},
          {title: 'Subcomisión (Subcommission)', value: 'subcommission'},
          {title: 'Otra unidad / Coordinación (Other)', value: 'other'},
        ],
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'commission',
    }),
    defineField({
      name: 'description',
      title: 'Descripción y atribuciones',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'parentUnit',
      title: 'Unidad superior (padre)',
      description: 'Permite estructurar jerarquías (ej. Subcomisión dependiente de una Comisión o Directorio).',
      type: 'reference',
      to: [{type: 'organizationUnit'}],
      validation: (Rule) =>
        Rule.custom((parentRef: any, context) => {
          if (!parentRef) return true
          const docId = (context.document?._id || '').replace(/^drafts\./, '')
          const targetId = (parentRef._ref || '').replace(/^drafts\./, '')
          if (docId && docId === targetId) {
            return 'Una unidad no puede ser su propia unidad superior (padre).'
          }
          return true
        }),
    }),
    defineField({
      name: 'members',
      title: 'Integrantes / Miembros del equipo',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'person',
              title: 'Persona',
              type: 'reference',
              to: [{type: 'person'}],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'role',
              title: 'Cargo o nombramiento',
              description: 'Ejemplo: "Presidente", "Secretaria", "Tesorero", "Vocal". Dejar vacío si no posee cargo visible.',
              type: 'string',
            }),
            defineField({
              name: 'contactEmail',
              title: 'Correo institucional del cargo',
              description: 'Correo propio del cargo (ej. presidente@fechitat.cl). Pertenece a la función, no a la persona.',
              type: 'string',
            }),
            defineField({
              name: 'order',
              title: 'Orden dentro de la unidad',
              type: 'number',
              initialValue: 1,
            }),
            defineField({
              name: 'startDate',
              title: 'Fecha de inicio del nombramiento',
              type: 'date',
            }),
            defineField({
              name: 'endDate',
              title: 'Fecha de cese del nombramiento',
              description: 'Si se omite o es fecha futura, el nombramiento está vigente.',
              type: 'date',
            }),
          ],
          preview: {
            select: {
              name: 'person.name',
              dan: 'person.dan',
              legacyTitle: 'person.legacyTitle',
              role: 'role',
              email: 'contactEmail',
              media: 'person.portrait',
            },
            prepare({name, dan, legacyTitle, role, email, media}) {
              const prefix = dan ? (dan >= 9 ? 'Gran Maestro ' : dan >= 7 ? 'Maestro ' : dan >= 4 ? 'Sb. ' : 'Bs. ') : (legacyTitle ? `${legacyTitle} ` : '')
              const personName = name ? `${prefix}${name}` : 'Persona no seleccionada'
              const subtitleParts = [role, email].filter(Boolean)
              return {
                title: personName,
                subtitle: subtitleParts.join(' · ') || 'Sin cargo especificado',
                media,
              }
            },
          },
        }),
      ],
      validation: (Rule) =>
        Rule.custom((members: any[] | undefined) => {
          if (!members || !Array.isArray(members)) return true
          const now = new Date().toISOString().split('T')[0]
          const activePersons = new Set<string>()

          for (const m of members) {
            const pId = m?.person?._ref
            if (!pId) continue
            // Es vigente si no tiene endDate o endDate >= hoy
            const isCurrent = !m.endDate || m.endDate >= now
            if (isCurrent) {
              if (activePersons.has(pId)) {
                return 'No se puede repetir la misma persona con nombramiento vigente en esta unidad.'
              }
              activePersons.add(pId)
            }
          }
          return true
        }),
    }),
    defineField({
      name: 'order',
      title: 'Orden de aparición',
      type: 'number',
      initialValue: 1,
    }),
    defineField({
      name: 'image',
      title: 'Imagen representativa o escudo',
      type: 'image',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      type: 'type',
      parent: 'parentUnit.name',
      media: 'image',
    },
    prepare({title, type, parent, media}) {
      const typeLabels: Record<string, string> = {
        board: 'Directorio',
        commission: 'Comisión',
        subcommission: 'Subcomisión',
        other: 'Otra unidad',
      }
      const subtitle = [typeLabels[type] || type, parent ? `Depende de: ${parent}` : null].filter(Boolean).join(' · ')
      return {
        title,
        subtitle,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Orden manual',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}, {field: 'name', direction: 'asc'}],
    },
  ],
})
