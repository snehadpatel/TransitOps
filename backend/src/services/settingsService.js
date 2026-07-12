const prisma = require('../utils/prismaClient');

const DEFAULT_SETTINGS = {
  id: 'global',
  depot_name: 'TransitOps Depot',
  currency: 'INR',
  distance_unit: 'km',
};

async function getSettings() {
  let settings = await prisma.setting.findUnique({ where: { id: 'global' } });
  if (!settings) {
    settings = await prisma.setting.create({ data: DEFAULT_SETTINGS });
  }
  return settings;
}

async function updateSettings(data) {
  return prisma.setting.upsert({
    where: { id: 'global' },
    update: data,
    create: { ...DEFAULT_SETTINGS, ...data },
  });
}

module.exports = { getSettings, updateSettings };
