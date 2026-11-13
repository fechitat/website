import {UserIcon} from '@sanity/icons/User'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Función auxiliar para calcular honorífico en previews de Sanity Studio.
 * Basado en Manual de Examen FECHITAT, p. 11.
 */
function computeHonorific(dan?: number | null, legacyTitle?: string | null): string {
  if (typeof dan === 'number' && Number.isInteger(dan) && dan >= 1) {
    if (dan >= 9) return 'Gran Maestro'
    if (dan >= 7) return 'Maestro'
    if (dan >= 4) return 'Sb.'
    if (dan >= 1) return 'Bs.'
  }
  if (legacyTitle && legacyTitle.trim()) {
    const lower = legacyTitle.toLowerCase()
    if (!lower.includes('maestro') && !lower.includes('master') && !lower.includes('sasonim')) {
      return legacyTitle.trim()
    }
  }
  return ''
}

export default defineType({
  name: 'person',
  title: 'Persona',
  icon: UserIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre completo (sin títulos ni prefijos marciales)',
      description: 'Escriba solo el nombre propio (ej. "Juan Bravo", no "Sb. Juan Bravo"). El título se calcula automáticamente.',
      type: 'string',
      validation: (Rule) =>
        Rule.required().custom((value) => {
          if (!value) return true
          const forbidden = ['sb.', 'bs.', 'sj.', 'maestro', 'gran maestro', 'master', 'prof.']
          const lower = value.toLowerCase().trim()
          for (const prefix of forbidden) {
            if (lower.startsWith(prefix)) {
              return `No incluya "${prefix}" en el nombre. Indique el grado Dan en el campo correspondiente.`
            }
          }
          return true
        }),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'dan',
      title: 'Grado Dan (Cinturón Negro)',
      description: 'Grado Dan oficial (1 a 9). Deja vacío si aún no posee grado Dan confirmado.',
      type: 'number',
      validation: (Rule) =>
        Rule.integer()
          .min(1)
          .max(9)
          .warning('El grado Dan en Taekwon-Do ITF comprende de 1er a 9no Dan.'),
    }),
    defineField({
      name: 'legacyTitle',
      title: 'Título legado (migración)',
      description: 'Título marcial previo mientras se valida el grado Dan oficial. Solo lectura.',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'portrait',
      title: 'Retrato oficial',
      description: 'Fotografía en plano medio o primer plano con dobok. Resolución recomendada: 400×500 px o superior.',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) =>
        Rule.custom((image: any) => {
          if (!image?.asset?._ref) return true
          // Se evalúa advertencia en clientes cuando se conozcan dimensiones
          return true
        }),
    }),
    defineField({
      name: 'shortBio',
      title: 'Biografía breve',
      description: 'Resumen en una o dos líneas para tarjetas y organigrama.',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'biography',
      title: 'Biografía completa / Trayectoria',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Enlaces y redes personales',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Plataforma',
              type: 'string',
              options: {
                list: [
                  {title: 'Instagram', value: 'instagram'},
                  {title: 'Facebook', value: 'facebook'},
                  {title: 'LinkedIn', value: 'linkedin'},
                  {title: 'X / Twitter', value: 'x'},
                  {title: 'Otra', value: 'other'},
                ],
              },
            }),
            defineField({name: 'url', title: 'URL', type: 'url'}),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      name: 'name',
      dan: 'dan',
      legacyTitle: 'legacyTitle',
      media: 'portrait',
    },
    prepare({name, dan, legacyTitle, media}) {
      const honorific = computeHonorific(dan, legacyTitle)
      const displayTitle = honorific ? `${honorific} ${name}` : name || 'Persona sin nombre'
      const subtitle = typeof dan === 'number' ? `${dan}° Dan ITF` : (legacyTitle || 'Sin grado Dan asignado')
      return {
        title: displayTitle,
        subtitle,
        media,
      }
    },
  },
})
