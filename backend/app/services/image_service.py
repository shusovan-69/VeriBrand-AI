import io
import math
from typing import Dict, Any, List, Optional
from PIL import Image


def hex_to_rgb(hex_code: str) -> tuple:
    hex_clean = hex_code.lstrip("#")
    if len(hex_clean) == 3:
        hex_clean = "".join([c * 2 for c in hex_clean])
    return tuple(int(hex_clean[i:i+2], 16) for i in (0, 2, 4))


def rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02x}{g:02x}{b:02x}".upper()


def color_distance(c1: tuple, c2: tuple) -> float:
    """Euclidean distance in RGB space normalized to 0-100 scale."""
    r_diff = c1[0] - c2[0]
    g_diff = c1[1] - c2[1]
    b_diff = c1[2] - c2[2]
    # Maximum possible distance is sqrt(3 * 255^2) ≈ 441.67
    dist = math.sqrt(r_diff**2 + g_diff**2 + b_diff**2)
    return (dist / 441.67) * 100.0


def calculate_contrast_ratio(rgb1: tuple, rgb2: tuple) -> float:
    """Calculates WCAG 2.2 relative luminance contrast ratio."""
    def luminance(rgb):
        vals = []
        for c in rgb:
            c_norm = c / 255.0
            if c_norm <= 0.03928:
                vals.append(c_norm / 12.92)
            else:
                vals.append(((c_norm + 0.055) / 1.055) ** 2.4)
        return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2]

    l1 = luminance(rgb1)
    l2 = luminance(rgb2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


class ImageReviewService:
    DEFAULT_APPROVED_PALETTE = [
        {"name": "Brand Deep Navy", "hex": "#0F172A", "role": "Primary Surface"},
        {"name": "Brand Indigo", "hex": "#4F46E5", "role": "Primary Brand Accent"},
        {"name": "Electric Cyan", "hex": "#06B6D4", "role": "Secondary Highlight"},
        {"name": "Brand White", "hex": "#FFFFFF", "role": "Background / Text Contrast"},
    ]

    @staticmethod
    def analyze_image_region(
        image_bytes: bytes,
        filename: str,
        sampled_hex: Optional[str] = None,
        crop_box: Optional[Dict[str, int]] = None
    ) -> Dict[str, Any]:
        """
        Analyzes uploaded image region against approved brand colors and outputs manual-review checklist.
        """
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size

        # If crop box is provided, sample dominant color from the box
        if crop_box:
            left = max(0, crop_box.get("x", 0))
            top = max(0, crop_box.get("y", 0))
            right = min(width, left + crop_box.get("w", 50))
            bottom = min(height, top + crop_box.get("h", 50))
            cropped = img.crop((left, top, right, bottom)).convert("RGB")
            # Average color
            stat = cropped.resize((1, 1))
            sampled_rgb = stat.getpixel((0, 0))
            actual_sampled_hex = rgb_to_hex(*sampled_rgb)
        elif sampled_hex:
            sampled_rgb = hex_to_rgb(sampled_hex)
            actual_sampled_hex = sampled_hex.upper()
        else:
            # Default sample center
            center_rgb = img.convert("RGB").getpixel((width // 2, height // 2))
            sampled_rgb = center_rgb
            actual_sampled_hex = rgb_to_hex(*center_rgb)

        # Compare with approved brand palette
        palette_matches = []
        best_match = None
        min_dist = float("inf")

        for color_item in ImageReviewService.DEFAULT_APPROVED_PALETTE:
            app_rgb = hex_to_rgb(color_item["hex"])
            dist = color_distance(sampled_rgb, app_rgb)
            match_data = {
                "color_name": color_item["name"],
                "approved_hex": color_item["hex"],
                "role": color_item["role"],
                "distance_percent": round(dist, 1),
                "is_match": dist <= 12.0  # Tolerance threshold
            }
            palette_matches.append(match_data)
            if dist < min_dist:
                min_dist = dist
                best_match = match_data

        # Contrast check against white background
        contrast_white = calculate_contrast_ratio(sampled_rgb, (255, 255, 255))
        contrast_dark = calculate_contrast_ratio(sampled_rgb, (15, 23, 42))

        is_palette_compliant = min_dist <= 12.0

        return {
            "filename": filename,
            "dimensions": {"width": width, "height": height},
            "sampled_hex": actual_sampled_hex,
            "sampled_rgb": {"r": sampled_rgb[0], "g": sampled_rgb[1], "b": sampled_rgb[2]},
            "closest_approved_color": best_match["color_name"] if best_match else "None",
            "closest_approved_hex": best_match["approved_hex"] if best_match else "None",
            "difference_score": round(min_dist, 1),
            "is_palette_compliant": is_palette_compliant,
            "all_palette_evaluations": palette_matches,
            "wcag_contrast": {
                "against_white": round(contrast_white, 2),
                "against_dark": round(contrast_dark, 2),
                "passes_aa_normal_text": (contrast_white >= 4.5 or contrast_dark >= 4.5),
                "passes_aa_large_text": (contrast_white >= 3.0 or contrast_dark >= 3.0)
            },
            "manual_review_prompts": [
                "Verify logo maintains at least 20px clear margin from bounding container.",
                "Ensure logo is not distorted, stretched, or placed over clashing photographic backgrounds.",
                "Verify minimum contrast meets WCAG 2.2 AA (>= 4.5:1 for standard body text)."
            ]
        }
