import { BadRequestException, Injectable, PipeTransform, type ArgumentMetadata } from '@nestjs/common';
import { scanForForbiddenPhiKeys, scanForForbiddenPhiText } from '@aura-note/security';

const additionalForbiddenPayloadKeys = new Set([
  'rawTranscript',
  'rawTranscriptText',
  'rawAudio',
  'rawAudioPayload',
  'rawAudioBytes',
  'productionConnectionString',
  'privateKey',
  'secret',
  'password'
]);

@Injectable()
export class AuraRequestValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body' || value === undefined || value === null) {
      return value;
    }

    if (Array.isArray(value) || typeof value !== 'object') {
      throw new BadRequestException('Request body must be a JSON object.');
    }

    const extraPaths = this.scanAdditionalForbiddenKeys(value);
    if (extraPaths.length) {
      throw new BadRequestException('Request body contains prohibited production credential, raw transcript, or raw audio fields.');
    }

    if (this.isAiGatewayGovernedPayload(value)) {
      return value;
    }

    const phiKeyScan = scanForForbiddenPhiKeys(value);
    const phiTextScan = scanForForbiddenPhiText(value);
    if (phiKeyScan.containsForbiddenPhi || phiTextScan.containsForbiddenPhiText) {
      throw new BadRequestException('Request body contains PHI-like fields or text that are not allowed at this API boundary.');
    }

    return value;
  }

  private scanAdditionalForbiddenKeys(value: unknown): string[] {
    const paths: string[] = [];

    function visit(current: unknown, path: string): void {
      if (Array.isArray(current)) {
        current.forEach((item, index) => visit(item, `${path}[${index}]`));
        return;
      }

      if (!current || typeof current !== 'object') return;

      for (const [key, child] of Object.entries(current as Record<string, unknown>)) {
        const childPath = path ? `${path}.${key}` : key;
        if (additionalForbiddenPayloadKeys.has(key)) {
          paths.push(childPath);
        }
        visit(child, childPath);
      }
    }

    visit(value, '');
    return paths;
  }

  private isAiGatewayGovernedPayload(value: unknown): boolean {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate.purpose === 'string' && typeof candidate.clinicalFacts === 'object' && Array.isArray(candidate.evidence);
  }
}
