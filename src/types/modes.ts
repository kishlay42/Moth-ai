export type MothMode = 'default' | 'plan' | 'autopilot';

export interface ModeConfig {
  name: MothMode;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  autoApprove: boolean;
  emphasizePlanning: boolean;
}

export const MODES: Record<MothMode, ModeConfig> = {
  default: {
    name: 'default',
    displayName: 'Default',
    description: 'Balanced approach - asks for permission',
    icon: '🔵',
    color: 'blue',
    autoApprove: false,
    emphasizePlanning: false
  },
  plan: {
    name: 'plan',
    displayName: 'Plan',
    description: 'Planning-first - creates detailed plans before execution',
    icon: '📋',
    color: 'magenta',
    autoApprove: false,
    emphasizePlanning: true
  },
  autopilot: {
    name: 'autopilot',
    displayName: 'Autopilot',
    description: 'Auto-execute - no permission prompts',
    icon: '🚀',
    color: 'yellow',
    autoApprove: true,
    emphasizePlanning: false
  }
};
