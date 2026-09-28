import os
import sys
import copy
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN

def build_deck():
    input_path = 'AlignMe Idea_Backup.pptx'
    output_path = 'AlignMe Idea.pptx'
    
    if not os.path.exists(input_path):
        input_path = 'AlignMe Idea.pptx'
        
    print(f"Loading base presentation from {input_path}...")
    prs = pptx.Presentation(input_path)
    
    # Template layout for content slides
    content_layout = prs.slides[4].slide_layout
    
    # Helper to copy decorative corner graphics from slide 5
    template_slide = prs.slides[4]
    corner_shapes = []
    for s in template_slide.shapes:
        if s.name in ['object 6', 'object 2', 'object 5']:
            corner_shapes.append(copy.deepcopy(s.element))
            
    def apply_corner_decorations(target_slide):
        for elem in corner_shapes:
            target_slide.shapes._spTree.append(copy.deepcopy(elem))
            
    def add_header(slide, title_text, subtitle_text):
        if slide.shapes.title:
            slide.shapes.title.text = title_text
            p = slide.shapes.title.text_frame.paragraphs[0]
            p.font.name = 'Aptos'
            p.font.bold = True
            p.font.size = Pt(28)
            p.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A) # Slate 900
            
        # Subtitle textbox
        sub_box = slide.shapes.add_textbox(Inches(3.5), Inches(1.35), Inches(13.0), Inches(0.5))
        tf = sub_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p_sub = tf.paragraphs[0]
        p_sub.text = subtitle_text
        p_sub.alignment = PP_ALIGN.CENTER
        p_sub.font.name = 'Aptos'
        p_sub.font.size = Pt(13)
        p_sub.font.bold = True
        p_sub.font.color.rgb = RGBColor(0x64, 0x74, 0x8B) # Slate 500

    def add_card(slide, left, top, width, height, bg_rgb, border_rgb):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_rgb
        card.line.color.rgb = border_rgb
        card.line.width = Pt(1.5)
        return card

    # ==========================================================
    # SLIDE A: CORE USPs & COMPETITIVE ADVANTAGES
    # ==========================================================
    print("Creating Slide: CORE USPs & COMPETITIVE ADVANTAGES...")
    slide_usp = prs.slides.add_slide(content_layout)
    apply_corner_decorations(slide_usp)
    add_header(slide_usp, "CORE USPs & COMPETITIVE ADVANTAGES", "Zero-Knowledge Edge Privacy  •  Personalized Baseline Calibration  •  Zero False-Alarm Hysteresis")

    usp_cards_data = [
        {
            "tag": "100% ZERO-KNOWLEDGE EDGE CV",
            "tag_color": RGBColor(0x25, 0x63, 0xEB), # Blue 600
            "title": "Absolute Optical Privacy",
            "bg": RGBColor(0xF2, 0xF7, 0xFF),
            "border": RGBColor(0xD3, 0xE1, 0xF4),
            "points": [
                ("Zero Cloud Video Streaming", "Raw webcam frames never leave the client device or traverse external servers, ensuring 100% HIPAA & GDPR compliance."),
                ("In-Browser WASM Execution", "Complete 33-point 3D anatomical skeletal extraction runs in WebAssembly with sub-10ms inference latency."),
                ("Offline Resilience", "Self-hosted local WASM binaries and TFLite neural models run smoothly without internet connectivity or CDN downtime."),
                ("Enterprise B2B Ready", "Safe for corporate-managed laptops in high-security finance, healthcare, and engineering environments.")
            ]
        },
        {
            "tag": "PERSONALIZED CALIBRATION ENGINE",
            "tag_color": RGBColor(0x05, 0x96, 0x69), # Emerald 600
            "title": "1-Click Neutral Spine Baseline",
            "bg": RGBColor(0xF0, 0xFA, 0xF6),
            "border": RGBColor(0xCF, 0xE8, 0xDC),
            "points": [
                ("Solves Fixed-Threshold Flaws", "Standard posture monitors fail because people have different heights, chairs, and natural spinal curvatures."),
                ("Relative Delta Monitoring", "Captures personal neutral baseline and tracks real-time deviation: Δ Neck Pitch, Δ Shoulder Roll, and Δ Torso Lean."),
                ("Desk Occlusion Biomechanics", "Gracefully estimates full-trunk vectors when hips are cropped below office desks, preventing tracking drops."),
                ("Instant Visual Confirmation", "HUD badge and harmonic confirmation tone verify personalized neutral lock in under 3 seconds.")
            ]
        },
        {
            "tag": "TEMPORAL HYSTERESIS CLASSIFIER",
            "tag_color": RGBColor(0xD9, 0x77, 0x06), # Amber 600
            "title": "False-Alarm Elimination & Active Rehab",
            "bg": RGBColor(0xFF, 0xF8, 0xEE),
            "border": RGBColor(0xFB, 0xE2, 0xC5),
            "points": [
                ("Zero Alert Fatigue", "Distinguishes normal micro-movements (taking a sip of coffee, shifting in chair) from sustained clinical slouching (>15s)."),
                ("Multi-Mode Biomechanics", "One-click toggle between Desk Sitting Ergonomics, Squat Depth & Rep Tracking, and Spinal Hold stability."),
                ("Web Audio Synthesizer", "Pleasant harmonic sine waves replace irritating buzzers, creating a positive biofeedback loop."),
                ("15s Guided Decompression", "Transforms passive surveillance into an active physical therapy coach with real-time breathing and posture cues.")
            ]
        }
    ]

    card_w = 5.45
    card_h = 7.15
    top_pos = 2.45
    left_positions = [1.55, 7.28, 13.0]

    for idx, data in enumerate(usp_cards_data):
        l = left_positions[idx]
        add_card(slide_usp, l, top_pos, card_w, card_h, data["bg"], data["border"])
        
        tb = slide_usp.shapes.add_textbox(Inches(l + 0.35), Inches(top_pos + 0.35), Inches(card_w - 0.7), Inches(card_h - 0.7))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        # Tag
        p_tag = tf.paragraphs[0]
        p_tag.text = data["tag"]
        p_tag.font.name = 'Aptos'
        p_tag.font.size = Pt(10.5)
        p_tag.font.bold = True
        p_tag.font.color.rgb = data["tag_color"]
        p_tag.space_after = Pt(4)
        
        # Title
        p_title = tf.add_paragraph()
        p_title.text = data["title"]
        p_title.font.name = 'Aptos'
        p_title.font.size = Pt(18)
        p_title.font.bold = True
        p_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        p_title.space_after = Pt(14)
        
        # Points
        for heading, body in data["points"]:
            p_bullet = tf.add_paragraph()
            p_bullet.text = f"•  {heading}: "
            p_bullet.font.name = 'Aptos'
            p_bullet.font.size = Pt(11)
            p_bullet.font.bold = True
            p_bullet.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
            p_bullet.space_before = Pt(6)
            
            run = p_bullet.add_run()
            run.text = body
            run.font.name = 'Aptos'
            run.font.size = Pt(10.5)
            run.font.bold = False
            run.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # ==========================================================
    # SLIDE B: LIVE SYSTEM DEMONSTRATION & SENSOR HUD (Demo Pic 1)
    # ==========================================================
    print("Creating Slide: LIVE SYSTEM DEMONSTRATION & SENSOR HUD...")
    slide_demo1 = prs.slides.add_slide(content_layout)
    apply_corner_decorations(slide_demo1)
    add_header(slide_demo1, "LIVE SYSTEM DEMONSTRATION & SENSOR HUD", "Real-Time 30 FPS Optical Inference  •  33-Point 3D Skeletal Overlay  •  Biomechanical Angle Gauges")

    # Left: Image Showcase Card
    img_card_w = 10.6
    img_card_h = 7.15
    add_card(slide_demo1, 1.55, top_pos, img_card_w, img_card_h, RGBColor(0xFF, 0xFF, 0xFF), RGBColor(0xCB, 0xD5, 0xE1))
    
    img_path_1 = "presentation_assets/demo_live_session.png"
    if os.path.exists(img_path_1):
        slide_demo1.shapes.add_picture(img_path_1, Inches(1.85), Inches(top_pos + 0.35), Inches(10.0), Inches(5.8))
        
        tb_cap = slide_demo1.shapes.add_textbox(Inches(1.85), Inches(top_pos + 6.3), Inches(10.0), Inches(0.6))
        tf_cap = tb_cap.text_frame
        tf_cap.word_wrap = True
        tf_cap.margin_left = tf_cap.margin_top = tf_cap.margin_right = tf_cap.margin_bottom = 0
        p_cap = tf_cap.paragraphs[0]
        p_cap.text = "LIVE CAMERA CV // USER LOCKED (30+ FPS) // REAL-TIME SKELETON & CENTER OF MASS RETICLE"
        p_cap.alignment = PP_ALIGN.CENTER
        p_cap.font.name = 'Aptos'
        p_cap.font.size = Pt(10)
        p_cap.font.bold = True
        p_cap.font.color.rgb = RGBColor(0x05, 0x96, 0x69)

    # Right: HUD Feature Analysis Card
    hud_card_w = 5.9
    add_card(slide_demo1, 12.55, top_pos, hud_card_w, img_card_h, RGBColor(0xF0, 0xFA, 0xF6), RGBColor(0xCF, 0xE8, 0xDC))
    
    tb_hud = slide_demo1.shapes.add_textbox(Inches(12.85), Inches(top_pos + 0.35), Inches(hud_card_w - 0.6), Inches(img_card_h - 0.7))
    tf_hud = tb_hud.text_frame
    tf_hud.word_wrap = True
    tf_hud.margin_left = tf_hud.margin_top = tf_hud.margin_right = tf_hud.margin_bottom = 0
    
    p_hud_tag = tf_hud.paragraphs[0]
    p_hud_tag.text = "COMPUTER VISION HUD CAPABILITIES"
    p_hud_tag.font.name = 'Aptos'
    p_hud_tag.font.size = Pt(10.5)
    p_hud_tag.font.bold = True
    p_hud_tag.font.color.rgb = RGBColor(0x05, 0x96, 0x69)
    p_hud_tag.space_after = Pt(4)
    
    p_hud_title = tf_hud.add_paragraph()
    p_hud_title.text = "Live Optical Telemetry"
    p_hud_title.font.name = 'Aptos'
    p_hud_title.font.size = Pt(18)
    p_hud_title.font.bold = True
    p_hud_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    p_hud_title.space_after = Pt(12)

    hud_points = [
        ("Sub-Millisecond Anatomical Tracking", "Continuous 33-point landmark tracking calculating 3D spatial vectors without specialized wearable sensors."),
        ("Real-Time Joint Angle Badges", "Dynamic overlays computing Cervical Pitch (<15°), Acromion Shoulder Balance (<3°), and Lumbar Torso Vector (<7°)."),
        ("Center of Mass (CoM) Reticle", "Visual crosshair tracking upper-body gravity center; flags anterior slouching before muscle fatigue sets in."),
        ("Bilateral Pelvic Symmetry", "Quantifies Left/Right weight distribution (e.g. 52% L / 48% R) to prevent unilateral spinal torque."),
        ("Multi-Movement Engine", "Includes Squat Movement Depth tracker with active phase detection and rep counting for active work breaks.")
    ]

    for h_title, h_desc in hud_points:
        p_item = tf_hud.add_paragraph()
        p_item.text = f"•  {h_title}: "
        p_item.font.name = 'Aptos'
        p_item.font.size = Pt(10.5)
        p_item.font.bold = True
        p_item.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        p_item.space_before = Pt(6)
        
        run = p_item.add_run()
        run.text = h_desc
        run.font.name = 'Aptos'
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # ==========================================================
    # SLIDE C: CLINICAL RESCUE RITUAL & ERGONOMIC AUDIT (Demo Pic 2)
    # ==========================================================
    print("Creating Slide: CLINICAL RESCUE RITUAL & ERGONOMIC AUDIT...")
    slide_demo2 = prs.slides.add_slide(content_layout)
    apply_corner_decorations(slide_demo2)
    add_header(slide_demo2, "CLINICAL RESCUE RITUAL & ERGONOMIC AUDIT", "Interactive Spinal Decompression  •  OSHA & RULA Compliant Clinical Audit Export")

    # Left: 15s Spinal Decompression Ritual Card
    ritual_w = 6.0
    add_card(slide_demo2, 1.55, top_pos, ritual_w, img_card_h, RGBColor(0xFF, 0xF8, 0xEE), RGBColor(0xFB, 0xE2, 0xC5))
    
    tb_rit = slide_demo2.shapes.add_textbox(Inches(1.85), Inches(top_pos + 0.35), Inches(ritual_w - 0.6), Inches(img_card_h - 0.7))
    tf_rit = tb_rit.text_frame
    tf_rit.word_wrap = True
    tf_rit.margin_left = tf_rit.margin_top = tf_rit.margin_right = tf_rit.margin_bottom = 0
    
    p_rit_tag = tf_rit.paragraphs[0]
    p_rit_tag.text = "ACTIVE CLINICAL INTERVENTION"
    p_rit_tag.font.name = 'Aptos'
    p_rit_tag.font.size = Pt(10.5)
    p_rit_tag.font.bold = True
    p_rit_tag.font.color.rgb = RGBColor(0xD9, 0x77, 0x06)
    p_rit_tag.space_after = Pt(4)
    
    p_rit_title = tf_rit.add_paragraph()
    p_rit_title.text = "15s Spinal Reset Ritual"
    p_rit_title.font.name = 'Aptos'
    p_rit_title.font.size = Pt(18)
    p_rit_title.font.bold = True
    p_rit_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    p_rit_title.space_after = Pt(10)

    ritual_phases = [
        ("Phase 1: Cervical Retraction (15-10s)", "Deep diaphragmatic inhale combined with deliberate chin retraction to align auditory canal directly over acromion shoulders."),
        ("Phase 2: Scapular Release (10-5s)", "Controlled scapular depression and retraction, opening the thoracic cavity and alleviating trapezius spasm."),
        ("Phase 3: Spinal Lengthening (5-0s)", "Axial decompression imaging an upward axial vector through the skull vertex, decompressing lumbar discs."),
        ("Harmonic Acoustic Chimes", "Frequency-modulating sine waves synthesize soothing auditory cues signaling phase transitions."),
        ("Gamified Recovery Incentive", "Awards +25 Ergonomic Recovery Score and immediately clears active strain episode flags upon ritual completion.")
    ]

    for r_title, r_desc in ritual_phases:
        p_phase = tf_rit.add_paragraph()
        p_phase.text = f"•  {r_title}: "
        p_phase.font.name = 'Aptos'
        p_phase.font.size = Pt(10.5)
        p_phase.font.bold = True
        p_phase.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        p_phase.space_before = Pt(6)
        
        run = p_phase.add_run()
        run.text = r_desc
        run.font.name = 'Aptos'
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Right: Dashboard & Audit Report Export Card
    dash_card_w = 10.5
    add_card(slide_demo2, 7.95, top_pos, dash_card_w, img_card_h, RGBColor(0xFF, 0xFF, 0xFF), RGBColor(0xCB, 0xD5, 0xE1))
    
    img_path_2 = "presentation_assets/demo_overview_dashboard.png"
    if os.path.exists(img_path_2):
        slide_demo2.shapes.add_picture(img_path_2, Inches(8.25), Inches(top_pos + 0.35), Inches(9.9), Inches(5.0))
        
        tb_audit = slide_demo2.shapes.add_textbox(Inches(8.25), Inches(top_pos + 5.5), Inches(9.9), Inches(1.3))
        tf_audit = tb_audit.text_frame
        tf_audit.word_wrap = True
        tf_audit.margin_left = tf_audit.margin_top = tf_audit.margin_right = tf_audit.margin_bottom = 0
        
        p_at = tf_audit.paragraphs[0]
        p_at.text = "OSHA & RULA COMPLIANT CLINICAL AUDIT REPORT (1-CLICK PRINT / PDF EXPORT)"
        p_at.font.name = 'Aptos'
        p_at.font.size = Pt(11)
        p_at.font.bold = True
        p_at.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
        p_at.space_after = Pt(2)
        
        p_ad = tf_audit.add_paragraph()
        p_ad.text = "• Rapid Upper Limb Assessment (RULA Action Levels 1-4) analyzing cumulative cervical load time.\n• Quantified anatomical breakdown and actionable workstation prescriptions (monitor riser height, forearm geometry).\n• Ready for physiotherapist consultations, orthopedic visits, and corporate health insurance wellness claims."
        p_ad.font.name = 'Aptos'
        p_ad.font.size = Pt(10)
        p_ad.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # ==========================================================
    # SLIDE D: FUTURE IMPLEMENTATION & SCALABILITY ROADMAP
    # ==========================================================
    print("Creating Slide: FUTURE IMPLEMENTATION & SCALABILITY ROADMAP...")
    slide_road = prs.slides.add_slide(content_layout)
    apply_corner_decorations(slide_road)
    add_header(slide_road, "FUTURE IMPLEMENTATION & SCALABILITY ROADMAP", "From Browser Intelligence to Enterprise Musculoskeletal Health Ecosystem")

    roadmap_data = [
        {
            "phase": "PHASE 1 // Q4 2026",
            "phase_color": RGBColor(0x25, 0x63, 0xEB), # Blue
            "title": "Smart Desk & IoT Actuation",
            "bg": RGBColor(0xF2, 0xF7, 0xFF),
            "border": RGBColor(0xD3, 0xE1, 0xF4),
            "points": [
                ("Matter / BLE Protocol", "Seamless pairing with motorized standing desks (IKEA, Autonomous, Uplift)."),
                ("Autonomous Height Shifts", "Automatically raises desk to standing height after 45 minutes of static seated slouching."),
                ("Haptic Chair Feedback", "Gentle vibration pulses embedded in lumbar chair cushions for silent physical prompts.")
            ]
        },
        {
            "phase": "PHASE 2 // Q1 2027",
            "phase_color": RGBColor(0x05, 0x96, 0x69), # Emerald
            "title": "Wearable Sensor Fusion",
            "bg": RGBColor(0xF0, 0xFA, 0xF6),
            "border": RGBColor(0xCF, 0xE8, 0xDC),
            "points": [
                ("Apple Watch / WearOS Sync", "Continuous background accelerometer & gyroscope streaming from smartwatches."),
                ("Multi-Axis Pose Validation", "Maintains accurate spinal curvature analysis even when user turns 90° away from webcam."),
                ("Heart Rate Variability (HRV)", "Correlates postural slump with sympathetic nervous system fatigue and cognitive load.")
            ]
        },
        {
            "phase": "PHASE 3 // Q2 2027",
            "phase_color": RGBColor(0xD9, 0x77, 0x06), # Amber
            "title": "B2B Enterprise Health Hub",
            "bg": RGBColor(0xFF, 0xF8, 0xEE),
            "border": RGBColor(0xFB, 0xE2, 0xC5),
            "points": [
                ("Anonymized Corporate Analytics", "Enterprise HR dashboards tracking aggregate musculoskeletal health across remote teams."),
                ("Insurance Rebate Integration", "Partnerships with health insurers offering verified posture wellness premium discounts."),
                ("Ergonomic Equipment Audits", "Data-driven hardware recommendations (ergonomic chairs, monitor arms) based on team metrics.")
            ]
        },
        {
            "phase": "PHASE 4 // Q3 2027",
            "phase_color": RGBColor(0x08, 0x91, 0xB2), # Cyan
            "title": "AI Predictive Spine Twin",
            "bg": RGBColor(0xF0, 0xF9, 0xFA),
            "border": RGBColor(0xCE, 0xEB, 0xF0),
            "points": [
                ("Spinal Digital Twin", "3D biomechanical modeling projecting long-term disc compression and cervical wear over 5-year horizons."),
                ("Preemptive Injury Forecasting", "Identifies early asymmetric compensation patterns preceding chronic sciatica or carpal tunnel."),
                ("Prescriptive Physical Therapy", "Auto-generates tailored physical therapy exercise prescriptions verified by orthopedic specialists.")
            ]
        }
    ]

    r_card_w = 4.05
    r_lefts = [1.55, 5.82, 10.09, 14.36]

    for idx, r_data in enumerate(roadmap_data):
        rl = r_lefts[idx]
        add_card(slide_road, rl, top_pos, r_card_w, card_h, r_data["bg"], r_data["border"])
        
        tb_r = slide_road.shapes.add_textbox(Inches(rl + 0.3), Inches(top_pos + 0.35), Inches(r_card_w - 0.6), Inches(card_h - 0.7))
        tf_r = tb_r.text_frame
        tf_r.word_wrap = True
        tf_r.margin_left = tf_r.margin_top = tf_r.margin_right = tf_r.margin_bottom = 0
        
        p_ph = tf_r.paragraphs[0]
        p_ph.text = r_data["phase"]
        p_ph.font.name = 'Aptos'
        p_ph.font.size = Pt(10)
        p_ph.font.bold = True
        p_ph.font.color.rgb = r_data["phase_color"]
        p_ph.space_after = Pt(4)
        
        p_rt = tf_r.add_paragraph()
        p_rt.text = r_data["title"]
        p_rt.font.name = 'Aptos'
        p_rt.font.size = Pt(16)
        p_rt.font.bold = True
        p_rt.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        p_rt.space_after = Pt(12)
        
        for p_heading, p_body in r_data["points"]:
            p_pt = tf_r.add_paragraph()
            p_pt.text = f"•  {p_heading}: "
            p_pt.font.name = 'Aptos'
            p_pt.font.size = Pt(10.5)
            p_pt.font.bold = True
            p_pt.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
            p_pt.space_before = Pt(8)
            
            run = p_pt.add_run()
            run.text = p_body
            run.font.name = 'Aptos'
            run.font.size = Pt(10)
            run.font.bold = False
            run.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # ==========================================================
    # REORDER SLIDES TO LOGICAL PRESENTATION FLOW
    # ==========================================================
    # Initial slide order:
    # 0: Cover (Slide 1)
    # 1: Team Details (Slide 2)
    # 2: Problem Statement (Slide 3)
    # 3: Problem Diagram (Slide 4)
    # 4: Proposed Solution (Slide 5)
    # 5: Solution Diagram (Slide 6)
    # 6: Technical Architecture (Slide 7)
    # 7: Impact & Benefit (Slide 8)
    # 8: Reference & Conclusion (Slide 9)
    # 9: slide_usp (Slide A)
    # 10: slide_demo1 (Slide B)
    # 11: slide_demo2 (Slide C)
    # 12: slide_road (Slide D)
    
    print("Reordering slides into cohesive pitch order...")
    sldIdLst = prs.slides._sldIdLst
    elem_list = list(sldIdLst)
    
    # Desired order:
    # 0, 1, 2, 3, 4, 5, 6 (up to Technical Architecture)
    # 9 (USPs)
    # 10 (Live Demo 1)
    # 11 (Clinical Features Demo 2)
    # 7 (Impact & Benefit)
    # 12 (Future Roadmap)
    # 8 (Reference & Conclusion)
    new_order = [
        elem_list[0],
        elem_list[1],
        elem_list[2],
        elem_list[3],
        elem_list[4],
        elem_list[5],
        elem_list[6],
        elem_list[9],  # USPs
        elem_list[10], # Demo 1
        elem_list[11], # Demo 2
        elem_list[7],  # Impact & Benefit
        elem_list[12], # Roadmap
        elem_list[8]   # Conclusion
    ]
    
    # Clear and repopulate
    for elem in elem_list:
        sldIdLst.remove(elem)
    for elem in new_order:
        sldIdLst.append(elem)

    print(f"Saving final deck to {output_path}...")
    prs.save(output_path)
    print("Presentation generation complete! Total slides:", len(prs.slides))

if __name__ == '__main__':
    build_deck()
