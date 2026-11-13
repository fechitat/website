import {HomeIcon} from '@sanity/icons/Home'
import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'federation',
  title: 'Federación',
  icon: HomeIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre oficial',
      type: 'string',
      validation: (Rule) => Rule.required(),
      initialValue: 'Federación Chilena de Taekwon-Do Tradicional (FECHITAT)',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (Rule) => Rule.required(),
      initialValue: {current: 'fechitat'},
    }),
    defineField({
      name: 'description',
      title: 'Descripción institucional',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'mission',
      title: 'Misión',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'vision',
      title: 'Visión',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'history',
      title: 'Reseña histórica',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'logo',
      title: 'Logo institucional',
      type: 'image',
    }),
    defineField({
      name: 'heroImage',
      title: 'Imagen de portada (Hero)',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'contactInformation',
      title: 'Información de contacto',
      type: 'object',
      fields: [
        defineField({name: 'email', title: 'Correo electrónico', type: 'string'}),
        defineField({name: 'phone', title: 'Teléfono', type: 'string'}),
        defineField({name: 'address', title: 'Dirección o sede', type: 'string'}),
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Redes sociales oficiales',
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
                  {title: 'YouTube', value: 'youtube'},
                  {title: 'TikTok', value: 'tiktok'},
                  {title: 'X / Twitter', value: 'x'},
                  {title: 'Otra', value: 'other'},
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'platform',
              subtitle: 'url',
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'metrics',
      title: 'Métricas institucionales',
      description: 'Métricas públicas mostradas en la portada y en la sección Jóvenes.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'key',
              title: 'Identificador técnico',
              type: 'string',
              options: {
                list: [
                  {title: 'Cinturones negros (blackBelts)', value: 'blackBelts'},
                  {title: 'Competidores activos (activeCompetitors)', value: 'activeCompetitors'},
                  {title: 'Medallas mundiales (worldMedals)', value: 'worldMedals'},
                  {title: 'Mayor logro (bestAchievement)', value: 'bestAchievement'},
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Etiqueta visible',
              type: 'string',
              description: 'Ejemplo: "Cinturones negros", "Competidores activos"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'mode',
              title: 'Modo de cálculo',
              type: 'string',
              options: {
                list: [
                  {title: 'Manual (valor fijo)', value: 'manual'},
                  {title: 'Calculado (desde reconocimientos)', value: 'computed'},
                ],
                layout: 'radio',
              },
              initialValue: 'manual',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Valor manual',
              type: 'string',
              description: 'Ejemplo: "50+", "200+", "2", "3.er". Requerido en modo manual o como fallback.',
              validation: (Rule) =>
                Rule.custom((val, context) => {
                  const parent = context.parent as {mode?: string} | undefined
                  if (parent?.mode === 'manual' && (!val || !val.trim())) {
                    return 'El valor es requerido cuando el modo es manual.'
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
              name: 'showOn',
              title: 'Sección donde se muestra',
              type: 'array',
              of: [{type: 'string'}],
              options: {
                list: [
                  {title: 'Portada (Home)', value: 'home'},
                  {title: 'Jóvenes', value: 'jovenes'},
                ],
              },
              initialValue: ['home'],
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'value',
              mode: 'mode',
            },
            prepare({title, subtitle, mode}) {
              return {
                title: title || 'Métrica',
                subtitle: `${subtitle || 'Sin valor'} (${mode === 'computed' ? 'Calculado' : 'Manual'})`,
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'logo',
    },
  },
})
