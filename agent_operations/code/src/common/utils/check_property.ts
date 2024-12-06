import logger from './logger';

export default function checkPropertyValue(obj: any, propertyPath: string): { ok: boolean; value: any } {
  const propertyValue = propertyPath.split('.').reduce((acc, curr) => acc?.[curr], obj);
  if (propertyValue === undefined) {
    logger.error('[obj].%s is undefined', propertyPath);
    return { ok: false, value: undefined };
  }
  return { ok: true, value: propertyValue };
}
