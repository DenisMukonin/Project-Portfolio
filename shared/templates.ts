export interface TemplateDefinition {
  id: string
  name: string
  description: string
  thumbnail: string
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple design with focus on content',
    thumbnail: '/templates/minimal.png'
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Modern developer-focused layout with dark accents',
    thumbnail: '/templates/tech.png'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold and expressive design for standing out',
    thumbnail: '/templates/creative.png'
  }
]

export const ALLOWED_TEMPLATES = TEMPLATES.map(t => t.id)

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find(t => t.id === id)
}

export function isAllowedTemplate(id: string): boolean {
  return ALLOWED_TEMPLATES.includes(id)
}
