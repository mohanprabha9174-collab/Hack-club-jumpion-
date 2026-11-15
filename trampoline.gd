extends Node2D

const PIXELS_PER_METER = 6
const HOME_X = 585.0
const CAMERA_OFFSET = -36.0

@onready var star: Node2D = $Jumpion
@onready var pad: Node2D = $Trampoline
@onready var camera: Camera2D = $Camera2D
@onready var motion: AnimationPlayer = $AnimationPlayer
@onready var float_anim: AnimationPlayer = $Jumpion/FloatAnimation


func intro() -> void:
	motion.play("fall_to_earth")
	motion.advance(0)
	camera.force_update_scroll()
	await motion.animation_finished
	star.rotation_degrees = 0.0
	float_anim.play("float")


func bounce(meters: int) -> void:
	stop_float()
	motion.play("toss_and_land")
	await motion.animation_finished
	motion.play("trampoline_release")

	var rise = meters * PIXELS_PER_METER
	var airtime = clampf(0.60 + meters * 0.010, 0.68, 1.60)
	var launch = create_tween().set_parallel(true)
	launch.tween_property(star, "position:y", -rise, airtime).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	launch.tween_property(star, "position:x", HOME_X, airtime).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	launch.tween_property(star, "rotation_degrees", 360.0, airtime).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	# Let Jumpion get ahead of the camera before it catches up.
	launch.tween_property(camera, "position:y", CAMERA_OFFSET - rise, airtime).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	await launch.finished

	move_stage(-rise)


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

	move_stage(drop)


func stop_float() -> void:
	float_anim.stop()
	star.get_node("Art").position.y = 0


func move_stage(y_change: float) -> void:
	position.y += y_change
	star.position = Vector2(HOME_X, 0)
	star.rotation_degrees = 0.0
	camera.position.y = CAMERA_OFFSET
	pad.visible = is_zero_approx(position.y)
	camera.force_update_scroll()
	float_anim.play("float")
