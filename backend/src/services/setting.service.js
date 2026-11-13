import Setting from '../models/Setting.js';
import { SETTINGS_DEFAULT } from '../utils/constants.js';

export const getSettings = async (session = null) => {
  const rows = await Setting.find({ key: { $in: Object.keys(SETTINGS_DEFAULT) } }).session(session).lean();
  return { ...SETTINGS_DEFAULT, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
};

export const getSetting = async (key, session = null) => (await getSettings(session))[key];
