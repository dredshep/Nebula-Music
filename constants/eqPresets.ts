// Equalizer preset system
export type EQPreset = 'flat' | 'rock' | 'pop' | 'jazz' | 'classical' | 'electronic' | 'bass-boost' | 'treble-boost' | 'vocal' | 'custom';

export interface EQBands {
    '32': number;
    '64': number;
    '125': number;
    '250': number;
    '500': number;
    '1k': number;
    '2k': number;
    '4k': number;
    '8k': number;
    '16k': number;
}

export const EQ_PRESETS: Record<EQPreset, Partial<EQBands>> = {
    flat: {
        '32': 0, '64': 0, '125': 0, '250': 0, '500': 0,
        '1k': 0, '2k': 0, '4k': 0, '8k': 0, '16k': 0
    },
    rock: {
        '32': 5, '64': 4, '125': -3, '250': -2, '500': 1,
        '1k': 3, '2k': 4, '4k': 5, '8k': 5, '16k': 5
    },
    pop: {
        '32': -2, '64': -1, '125': 0, '250': 2, '500': 4,
        '1k': 4, '2k': 2, '4k': 0, '8k': -1, '16k': -2
    },
    jazz: {
        '32': 0, '64': 0, '125': 0, '250': 2, '500': 3,
        '1k': 3, '2k': 2, '4k': 1, '8k': 2, '16k': 3
    },
    classical: {
        '32': 0, '64': 0, '125': 0, '250': 0, '500': 0,
        '1k': 0, '2k': -2, '4k': -2, '8k': -2, '16k': -3
    },
    electronic: {
        '32': 6, '64': 5, '125': 2, '250': 0, '500': -2,
        '1k': 2, '2k': 0, '4k': 2, '8k': 4, '16k': 5
    },
    'bass-boost': {
        '32': 8, '64': 6, '125': 4, '250': 2, '500': 0,
        '1k': 0, '2k': 0, '4k': 0, '8k': 0, '16k': 0
    },
    'treble-boost': {
        '32': 0, '64': 0, '125': 0, '250': 0, '500': 0,
        '1k': 0, '2k': 2, '4k': 4, '8k': 6, '16k': 8
    },
    vocal: {
        '32': -3, '64': -2, '125': -1, '250': 1, '500': 3,
        '1k': 4, '2k': 4, '4k': 3, '8k': 1, '16k': 0
    },
    custom: {} // Empty, user-defined
};

export const EQ_BAND_LABELS: Record<keyof EQBands, string> = {
    '32': '32',
    '64': '64',
    '125': '125',
    '250': '250',
    '500': '500',
    '1k': '1K',
    '2k': '2K',
    '4k': '4K',
    '8k': '8K',
    '16k': '16K'
};

export const EQ_PRESET_LABELS: Record<EQPreset, string> = {
    flat: 'Flat',
    rock: 'Rock',
    pop: 'Pop',
    jazz: 'Jazz',
    classical: 'Classical',
    electronic: 'Electronic',
    'bass-boost': 'Bass Boost',
    'treble-boost': 'Treble Boost',
    vocal: 'Vocal',
    custom: 'Custom'
};
