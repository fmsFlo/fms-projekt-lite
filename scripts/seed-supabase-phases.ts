import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedPhases() {
  console.log('Seeding Pipeline Phases...');

  const leadPhases = [
    {
      name: 'Neu',
      slug: 'lead-new',
      order: 0,
      color: '#94A3B8',
      type: 'lead',
      isDefault: true,
      isConverted: false,
      isActive: true,
    },
    {
      name: 'Kontaktiert',
      slug: 'lead-contacted',
      order: 1,
      color: '#3B82F6',
      type: 'lead',
      isDefault: false,
      isConverted: false,
      isActive: true,
    },
    {
      name: 'Nurturing',
      slug: 'lead-nurturing',
      order: 2,
      color: '#8B5CF6',
      type: 'lead',
      isDefault: false,
      isConverted: false,
      isActive: true,
    },
    {
      name: 'Qualifiziert',
      slug: 'lead-qualified',
      order: 3,
      color: '#10B981',
      type: 'lead',
      isDefault: false,
      isConverted: true,
      isActive: true,
    },
    {
      name: 'Unqualifiziert',
      slug: 'lead-unqualified',
      order: 4,
      color: '#EF4444',
      type: 'lead',
      isDefault: false,
      isConverted: false,
      isActive: true,
    },
  ];

  const opportunityPhases = [
    {
      name: 'Vorqualifiziert',
      slug: 'opp-pre-qualified',
      order: 0,
      color: '#F59E0B',
      type: 'opportunity',
      description: 'Der Lead wurde kontaktiert ist grdsl. qualifiziert, aber ein Setting Gespräch wurde nicht vereinbart.',
      probability: 10,
      status: 'open',
      isActive: true,
    },
    {
      name: 'Setting terminiert',
      slug: 'opp-setting-scheduled',
      order: 1,
      color: '#3B82F6',
      type: 'opportunity',
      description: 'Der Lead wurde qualifiziert und ist für ein Setting terminiert.',
      probability: 25,
      status: 'open',
      isActive: true,
    },
    {
      name: 'Konzeptgespräch terminiert',
      slug: 'opp-concept-scheduled',
      order: 2,
      color: '#8B5CF6',
      type: 'opportunity',
      description: 'Das Setting Gespräch wurde erfolgreich durchgeführt und ein Konzeptgespräch wurde terminiert.',
      probability: 50,
      status: 'open',
      isActive: true,
    },
    {
      name: 'Umsatzgespräch terminiert',
      slug: 'opp-sales-scheduled',
      order: 3,
      color: '#6366F1',
      type: 'opportunity',
      description: 'Das Konzeptgespräch wurde erfolgreich durchgeführt und ein Umsatzgespräch wurde terminiert.',
      probability: 80,
      status: 'open',
      isActive: true,
    },
    {
      name: 'Closed Won',
      slug: 'opp-closed-won',
      order: 4,
      color: '#10B981',
      type: 'opportunity',
      description: 'Der Lead ist konvertiert. Weitere Termine stehen nicht aus.',
      probability: 100,
      status: 'won',
      isActive: true,
    },
    {
      name: 'Closed Lost',
      slug: 'opp-closed-lost',
      order: 5,
      color: '#EF4444',
      type: 'opportunity',
      description: 'Der Lead war im Sales Prozess hat aber kein Interesse an einer Umsetzung.',
      probability: 0,
      status: 'lost',
      isActive: true,
    },
    {
      name: 'Servicegespräch (nach Umsatz)',
      slug: 'opp-service-after-sales',
      order: 6,
      color: '#10B981',
      type: 'opportunity',
      description: 'Servicegespräch nach erfolgreichem Umsatz.',
      probability: 100,
      status: 'won',
      isActive: true,
    },
    {
      name: 'Follow Up Setting',
      slug: 'opp-follow-up-setting',
      order: 7,
      color: '#F59E0B',
      type: 'opportunity',
      description: 'Follow Up nach Setting Gespräch.',
      probability: 15,
      status: 'open',
      isActive: true,
    },
    {
      name: 'Konzeptgespräch Follow Up',
      slug: 'opp-concept-follow-up',
      order: 8,
      color: '#8B5CF6',
      type: 'opportunity',
      description: 'Follow Up nach Konzeptgespräch.',
      probability: 40,
      status: 'open',
      isActive: true,
    },
    {
      name: 'Umsatzgespräch Follow Up',
      slug: 'opp-sales-follow-up',
      order: 9,
      color: '#6366F1',
      type: 'opportunity',
      description: 'Follow Up nach Umsatzgespräch.',
      probability: 70,
      status: 'open',
      isActive: true,
    },
  ];

  const allPhases = [...leadPhases, ...opportunityPhases];

  for (const phase of allPhases) {
    const id = `phase_${randomBytes(8).toString('hex')}`;

    let sqlValues = `
INSERT INTO "PipelinePhase" (
  id, name, slug, "order", color, type, "isActive", "isDefault", "isConverted",
  description, probability, status, "createdAt", "updatedAt"
) VALUES (
  '${id}',
  '${phase.name}',
  '${phase.slug}',
  ${phase.order},
  '${phase.color}',
  '${phase.type}',
  ${phase.isActive},
  ${phase.isDefault ?? false},
  ${phase.isConverted ?? false},
  ${phase.description ? `'${phase.description.replace(/'/g, "''")}'` : 'NULL'},
  ${phase.probability ?? 'NULL'},
  ${phase.status ? `'${phase.status}'` : 'NULL'},
  NOW(),
  NOW()
);`;

    console.log(`Inserting phase: ${phase.name}...`);
    console.log(sqlValues);
  }

  console.log('All phases seeded successfully!');
}

seedPhases();
