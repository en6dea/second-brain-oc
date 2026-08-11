#!/usr/bin/env python3
"""Генератор тёмной палитры из светлой.

Тёмная тема в проекте была переведена лишь частично: конвертировали семейство
--lm-*, а прежние палитры (--v78-*, --v87-*, --v88-*, --v103-* и другие)
остались светлыми. Из-за этого на тёмном фоне оставался тёмный текст.

Скрипт берёт светлые значения токенов и выводит тёмные, сохраняя оттенок:
поверхности темнеют, текст светлеет, акценты остаются узнаваемыми.

Запуск: python make-dark-tokens.py  (пишет dark-tokens.css)
Значения берутся из tokens-light.json (снимается из браузера в светлой теме).
"""

import colorsys
import json
import re

SCOPE = 'html:is(.v70-theme-dark,.v80-dark,.v87-dark,.v88-dark)'
OUTPUT = 'dark-tokens.css'

# Светлый текст тёмной темы — тот же, что у Lumen, чтобы палитры не спорили.
INK = (0.94, 0.945, 0.965)


def hex_to_rgb(value):
    value = value.lstrip('#')
    if len(value) == 3:
        value = ''.join(ch * 2 for ch in value)
    if len(value) != 6:
        return None
    return tuple(int(value[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb_to_hex(rgb):
    return '#%02X%02X%02X' % tuple(max(0, min(255, round(c * 255))) for c in rgb)


def convert_hex(value):
    rgb = hex_to_rgb(value)
    if rgb is None:
        return None
    h, l, s = colorsys.rgb_to_hls(*rgb)

    # Насыщенность в HLS у почти белых цветов вычисляется высокой: #f4f7fb
    # формально «насыщенный», хотя на глаз это белый. Поэтому цветность
    # измеряем разностью каналов — она не врёт на краях.
    # Порог 0.20 оставляет серо-голубые оттенки текста нейтральными.
    chroma = max(rgb) - min(rgb)

    if chroma < 0.20:
        if l > 0.82:                       # полотно, карточки, панели
            # Держим лёгкий холодный подтон Lumen вместо чистого чёрного.
            new_l = 0.055 + (1 - l) * 0.5
            new_s = 0.10
            h = 0.63
        elif l < 0.35:                     # основной текст
            new_l = 0.945
            new_s = 0.08
            h = 0.63
        else:                              # приглушённый текст
            new_l = min(0.70, max(0.52, 1 - l))
            new_s = min(0.12, s)
    else:
        # Цветные акценты: тон сохраняем, светлоту поднимаем под тёмный фон.
        new_l = min(0.74, max(0.60, l + 0.14))
        new_s = min(0.82, max(0.45, s * 0.9))

    return rgb_to_hex(colorsys.hls_to_rgb(h, new_l, new_s))


def convert_rgba(value):
    """Линии и подложки: тёмная краска по светлому фону → светлая по тёмному."""
    def repl(match):
        parts = [p.strip() for p in match.group(1).split(',')]
        if len(parts) < 3:
            return match.group(0)
        try:
            r, g, b = (int(float(p)) for p in parts[:3])
        except ValueError:
            return match.group(0)
        alpha = parts[3] if len(parts) > 3 else '1'
        lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
        if lum > 0.72:                      # была светлая заливка → тёмная
            return f'rgba(18,19,26,{alpha})'
        return f'rgba(240,241,246,{alpha})'  # была тёмная линия → светлая
    return re.sub(r'rgba?\(([^)]+)\)', repl, value)


def convert(name, value):
    value = value.strip()
    if not value or value.endswith(('px', 'ms', 's')) or 'cubic-bezier' in value:
        return None
    if 'Onest' in value or 'sans-serif' in value:
        return None

    if value.startswith('#'):
        return convert_hex(value)

    if 'rgba' in value or 'rgb(' in value:
        # Тени на тёмном фоне должны быть глубже, иначе их попросту не видно.
        if 'shadow' in name or 'glow' in name or 'px' in value:
            return re.sub(r'rgba?\([^)]+\)', 'rgba(0,0,0,.55)', value)
        return convert_rgba(value)
    return None


def main():
    with open('tokens-light.json', encoding='utf-8') as handle:
        tokens = json.load(handle)

    lines = [
        '',
        '/* ---------------------------------------------------------------',
        '   Тёмные значения прежних палитр.',
        '',
        '   Сгенерировано make-dark-tokens.py из светлых значений: перекраска',
        '   Lumen затронула только --lm-*, а --v78-*, --v87-*, --v88-* и прочие',
        '   остались светлыми — отсюда тёмный текст на тёмном фоне.',
        '',
        '   Правки вносите в скрипт и пересоберите, иначе они потеряются.',
        '   -------------------------------------------------------------- */',
        f'{SCOPE} {{'
    ]

    converted = 0
    for name in sorted(tokens):
        result = convert(name, tokens[name])
        if result:
            lines.append(f'  {name}: {result};')
            converted += 1
    lines.append('}')

    lines.append(f'/* токенов переведено: {converted} из {len(tokens)} */')
    # Пишем файл сами: перенаправление вывода на Windows сохранило бы его
    # в кодировке консоли, и кириллица в комментариях превратилась бы в мусор.
    with open(OUTPUT, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write('\n'.join(lines) + '\n')
    print(f'{OUTPUT}: переведено {converted} из {len(tokens)}')


if __name__ == '__main__':
    main()
