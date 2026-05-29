import numpy as np
from PIL import Image
import pickle


def logistic_map(x, r, iterations):
    sequence = []
    for _ in range(iterations):
        x = r * x * (1 - x)
        sequence.append(x)
    return sequence


def unscramble_pixels(scrambled_array, chaos_sequence):
    height, width = scrambled_array.shape[:2]
    total_pixels = height * width

    # Generate same indices used in encryption
    indices = np.argsort(chaos_sequence[:total_pixels])

    # Create reverse mapping
    reverse_indices = np.argsort(indices)

    # Flatten and unscramble
    if len(scrambled_array.shape) == 3:
        channels = scrambled_array.shape[2]
        flat_image = scrambled_array.reshape(-1, channels)
        unscrambled = flat_image[reverse_indices]
        unscrambled_image = unscrambled.reshape(height, width, channels)
    else:
        flat_image = scrambled_array.flatten()
        unscrambled = flat_image[reverse_indices]
        unscrambled_image = unscrambled.reshape(height, width)

    return unscrambled_image


def decrypt_image(encrypted_path, output_path, user_key):
    try:
        # Load encrypted data
        with open(encrypted_path, 'rb') as f:
            encryption_data = pickle.load(f)

        # Verify user key - normalize both keys by removing dashes and converting to uppercase
        stored_key = encryption_data.get('user_key', '').replace('-', '').upper()
        user_key_normalized = user_key.replace('-', '').upper()
        print("User entered: ",user_key_normalized)
        if stored_key != user_key_normalized:
            raise ValueError("Invalid RSA key. Decryption failed.")

        # Extract encryption parameters
        encrypted_array = encryption_data['encrypted_image']
        x0 = encryption_data['x0']
        r = encryption_data['r']
        original_shape = encryption_data['shape']
        original_mode = encryption_data['mode']
        original_filename = encryption_data['filename']

        # Calculate pixel count
        if len(original_shape) == 3:
            total_pixels = original_shape[0] * original_shape[1]
        else:
            total_pixels = original_shape[0] * original_shape[1]

        # Regenerate chaotic sequence with same parameters
        chaos_sequence = logistic_map(x0, r, total_pixels)

        # Unscramble pixels
        decrypted_array = unscramble_pixels(encrypted_array, chaos_sequence)

        # Convert back to image
        decrypted_image = Image.fromarray(decrypted_array.astype('uint8'), mode=original_mode)

        # Save decrypted image
        decrypted_image.save(output_path)

        return original_filename

    except FileNotFoundError:
        raise ValueError("Encrypted file not found.")
    except pickle.UnpicklingError:
        raise ValueError("Corrupted or invalid encrypted file.")
    except KeyError as e:
        raise ValueError(f"Missing encryption data: {str(e)}")
    except Exception as e:
        raise ValueError(f"Decryption failed: {str(e)}")


def reverse_diffusion(diffused_array, chaos_sequence):
    # Convert chaos values to integers (0-255)
    chaos_bytes = np.array(chaos_sequence * 255, dtype=np.uint8)

    # Apply XOR operation (same as encryption)
    if len(diffused_array.shape) == 3:
        height, width, channels = diffused_array.shape
        original = diffused_array.copy()
        for c in range(channels):
            flat_channel = original[:, :, c].flatten()
            chaos_key = chaos_bytes[:len(flat_channel)]
            flat_channel = np.bitwise_xor(flat_channel, chaos_key)
            original[:, :, c] = flat_channel.reshape(height, width)
    else:
        flat_image = diffused_array.flatten()
        chaos_key = chaos_bytes[:len(flat_image)]
        original = np.bitwise_xor(flat_image, chaos_key)
        original = original.reshape(diffused_array.shape)

    return original


def verify_decryption(original_path, decrypted_path):
    try:
        original = np.array(Image.open(original_path))
        decrypted = np.array(Image.open(decrypted_path))

        return np.array_equal(original, decrypted)
    except Exception:
        return False


if __name__ == '__main__':
    print("Decryption module loaded successfully")