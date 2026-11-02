import os
import numpy as np
from PIL import Image
from scipy.ndimage import label, binary_dilation

sheet_path = 'public/images/badges/svm-achievement-badge-sheet.png'
out_dir = 'public/images/badges'
os.makedirs(out_dir, exist_ok=True)

img = Image.open(sheet_path).convert('RGB')
arr = np.array(img)

# 12 badges configuration (3 rows, 4 cols)
boxes = [
    # Row 0
    {'filename': 'first-step.png', 'name': 'First Step', 'box': (25, 0, 275, 225)},
    {'filename': 'brave-beginner.png', 'name': 'Brave Beginner', 'box': (275, 0, 520, 227)},
    {'filename': 'creative-explorer.png', 'name': 'Creative Explorer', 'box': (520, 0, 765, 225)},
    {'filename': 'rising-star.png', 'name': 'Rising Star', 'box': (765, 0, 1010, 225)},
    # Row 1
    {'filename': 'voice-of-svm.png', 'name': 'Voice of SVM', 'box': (25, 222, 275, 444)},
    {'filename': 'rhythm-keeper.png', 'name': 'Rhythm Keeper', 'box': (275, 222, 520, 444)},
    {'filename': 'frame-artist.png', 'name': 'Frame Artist', 'box': (520, 222, 765, 444)},
    {'filename': 'word-weaver.png', 'name': 'Word Weaver', 'box': (765, 222, 1010, 447)},
    # Row 2
    {'filename': 'canvas-creator.png', 'name': 'Canvas Creator', 'box': (25, 442, 275, 670)},
    {'filename': 'melody-maker.png', 'name': 'Melody Maker', 'box': (275, 442, 520, 670)},
    {'filename': 'team-spirit.png', 'name': 'Team Spirit', 'box': (520, 442, 765, 670)},
    {'filename': 'culture-contributor.png', 'name': 'Culture Contributor', 'box': (765, 442, 1010, 670)},
]

for b in boxes:
    x1, y1, x2, y2 = b['box']
    crop_rgb = arr[y1:y2, x1:x2].copy()
    
    # Content detection based on non-white pixels
    is_white = (crop_rgb[:, :, 0] >= 246) & (crop_rgb[:, :, 1] >= 246) & (crop_rgb[:, :, 2] >= 246)
    content_mask = ~is_white
    
    ys, xs = np.where(content_mask)
    if len(ys) == 0:
        continue
    
    pad = 4
    min_y = max(0, ys.min() - pad)
    max_y = min(crop_rgb.shape[0], ys.max() + pad + 1)
    min_x = max(0, xs.min() - pad)
    max_x = min(crop_rgb.shape[1], xs.max() + pad + 1)
    
    badge_crop = crop_rgb[min_y:max_y, min_x:max_x].copy()
    H, W, _ = badge_crop.shape
    
    # Exterior background mask via connected components on near_white
    near_white = (badge_crop[:, :, 0] >= 242) & (badge_crop[:, :, 1] >= 242) & (badge_crop[:, :, 2] >= 242)
    labeled, num_features = label(near_white)
    
    # Border labels that touch the very outside
    border_mask = np.zeros((H, W), dtype=bool)
    border_mask[0, :] = True
    border_mask[-1, :] = True
    border_mask[:, 0] = True
    border_mask[:, -1] = True
    
    border_labels = set(np.unique(labeled[border_mask]))
    border_labels.discard(0)  # 0 is content
    
    exterior_bg = np.isin(labeled, list(border_labels))
    
    # Create RGBA
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[:, :, :3] = badge_crop
    
    alpha = np.ones((H, W), dtype=np.float32) * 255.0
    alpha[exterior_bg] = 0.0
    
    # Defringe and smooth alpha on boundary
    edge_zone = binary_dilation(exterior_bg, iterations=2) & ~exterior_bg
    for ey, ex in zip(*np.where(edge_zone)):
        pix = badge_crop[ey, ex].astype(np.float32)
        min_c = min(pix[0], pix[1], pix[2])
        if min_c > 200:
            a_factor = 1.0 - ((min_c - 200.0) / 52.0)
            a_factor = float(np.clip(a_factor, 0.05, 1.0))
            alpha[ey, ex] = 255.0 * a_factor
            for ch in range(3):
                badge_crop[ey, ex, ch] = int(np.clip(badge_crop[ey, ex, ch] * a_factor, 0, 255))
    
    rgba[:, :, :3] = badge_crop
    rgba[:, :, 3] = alpha.astype(np.uint8)
    
    out_img = Image.fromarray(rgba, 'RGBA')
    out_path = os.path.join(out_dir, b['filename'])
    out_img.save(out_path, 'PNG', optimize=True)
    print(f"Saved {b['name']} -> {out_path} ({W}x{H})")

print("All 12 badges cropped and saved successfully!")

