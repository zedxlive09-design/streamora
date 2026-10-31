import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Default site settings
  await prisma.siteSetting.upsert({
    where: { key: 'brandName' },
    update: {},
    create: { key: 'brandName', value: 'Streamora' },
  })
  await prisma.siteSetting.upsert({
    where: { key: 'footerAttribution' },
    update: {},
    create: {
      key: 'footerAttribution',
      value: 'Channel data © iptv-org (CC0). Streamora is an independent aggregator.',
    },
  })
  await prisma.siteSetting.upsert({
    where: { key: 'defaultCountry' },
    update: {},
    create: { key: 'defaultCountry', value: '' },
  })

  // Demo ad slot
  const existingAd = await prisma.adSlot.findFirst({ where: { name: 'Welcome banner' } })
  if (!existingAd) {
    await prisma.adSlot.create({
      data: {
        name: 'Welcome banner',
        position: 'home-top',
        type: 'text',
        content: 'Welcome to Streamora — your customizable free TV platform. Sign up to save favorites.',
        frequency: 'once-per-session',
        isActive: true,
        metadata: JSON.stringify({ dismissible: true }),
        placements: { create: [{ page: 'home' }] },
      },
    })
  }

  // Demo admin user (only if no users exist)
  const userCount = await prisma.user.count()
  if (userCount === 0) {
    const passwordHash = await bcrypt.hash('streamora-demo-123', 12)
    await prisma.user.create({
      data: {
        email: 'demo@streamora.local',
        name: 'Streamora Demo Admin',
        passwordHash,
        role: 'SUPERADMIN',
        profile: { create: { displayName: 'Demo Admin' } },
      },
    })
    console.log('Seeded demo superadmin: demo@streamora.local / streamora-demo-123')
  } else {
    console.log(`Users already exist (${userCount}); skipping demo admin seed.`)
  }

  console.log('Seed complete.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
