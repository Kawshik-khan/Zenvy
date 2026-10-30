package app.zenvy.zenvy

import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private var ringtone: Ringtone? = null

    // Plays the phone's own ringtone for incoming calls (see lib/util/ringer.dart).
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "zenvy/ringer").setMethodCallHandler { call, result ->
            when (call.method) {
                "start" -> {
                    startRingtone()
                    result.success(null)
                }
                "stop" -> {
                    stopRingtone()
                    result.success(null)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun startRingtone() {
        if (ringtone?.isPlaying == true) return
        val uri = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_RINGTONE)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ?: return
        // USAGE_NOTIFICATION_RINGTONE follows the ring mode, so silent and vibrate-only stay quiet.
        ringtone = RingtoneManager.getRingtone(this, uri)?.apply {
            audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) isLooping = true
            play()
        }
    }

    private fun stopRingtone() {
        ringtone?.stop()
        ringtone = null
    }

    override fun onDestroy() {
        stopRingtone()
        super.onDestroy()
    }
}
