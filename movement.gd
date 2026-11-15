extends Node2D

const PIXELS_PER_METER = 6
const REST_X = 585.0
const CAMERA_OFFSET = -36.0

@onready var star: Node2D = $Jumpion
@onready var art: Node2D = $Jumpion/Art
@onready var pad: Node2D = $Trampoline
@onready var camera: Camera2D = $Camera2D
@onready var motion: AnimationPlayer = $AnimationPlayer
@onready var float_anim: AnimationPlayer = $Jumpion/FloatAnimation
@onready var bubble: Panel = $SpeechBubble
@onready var speech: Label = $SpeechBubble/Text


func intro() -> void:
	motion.play("fall_to_earth")
	motion.advance(0)
	camera.force_update_scroll()
	await motion.animation_finished
	star.rotation_degrees = 0.0
	float_anim.play("float")


func say(line: String) -> void:
	speech.text = line
	bubble.visible = not line.is_empty()


func climb(meters: int, use_trampoline: bool) -> void:
	stop_float()
	if use_trampoline:
		motion.play("toss_and_land")
		await motion.animation_finished
		motion.play("trampoline_release")

	var rise = meters * PIXELS_PER_METER
	var airtime = clampf(0.60 + meters * 0.010, 0.68, 1.60)
	var launch = create_tween().set_parallel(true)
	launch.tween_property(star, "position:y", -rise, airtime).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	if use_trampoline:
		launch.tween_property(star, "position:x", REST_X, airtime).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
		launch.tween_property(star, "rotation_degrees", 360.0, airtime).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	# Let Jumpion get ahead of the camera before it catches up.
	launch.tween_property(camera, "position:y", CAMERA_OFFSET - rise, airtime).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	await launch.finished

	settle_at_height(-rise)


func fall(meters: int) -> void:
	stop_float()
	motion.play("lose_balance")
	await motion.animation_finished

	var drop = -meters * PIXELS_PER_METER
	var tumble = create_tween().set_parallel(true)
	tumble.tween_property(star, "position:y", drop, 0.45).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)
	tumble.tween_property(star, "rotation_degrees", 0.0, 0.45)
	tumble.tween_property(camera, "position:y", CAMERA_OFFSET + drop, 0.45).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)
	await tumble.finished

	settle_at_height(drop)


func stop_float() -> void:
	float_anim.stop()
	art.position.y = 0


func settle_at_height(y_change: float) -> void:
	position.y += y_change
	star.position = Vector2(REST_X, 0)
	star.rotation_degrees = 0.0
	camera.position.y = CAMERA_OFFSET
	pad.hide()
	camera.force_update_scroll()
	float_anim.play("float")
