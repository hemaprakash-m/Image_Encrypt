import numpy as np
from PIL import Image
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
import pickle
import random
import string


def generate_rsa_key():
    """Generate a formatted RSA key string (12 characters)"""
    # Generate random alphanumeric key
    chars = string.ascii_uppercase + string.digits
    key = ''.join(random.choices(chars, k=12))
    return key


def logistic_map(x, r, iterations):

    sequence = []
    for _ in range(iterations):
        x = r * x * (1 - x)
        sequence.append(x)
    return sequence


def scramble_pixels(image_array, chaos_sequence):
    height, width = image_array.shape[:2]
    total_pixels = height * width
    
    # Generate indices based on chaos sequence
    indices = np.argsort(chaos_sequence[:total_pixels])
    
    # Flatten image
    if len(image_array.shape) == 3:
        channels = image_array.shape[2]
        flat_image = image_array.reshape(-1, channels)
        scrambled = flat_image[indices]
        scrambled_image = scrambled.reshape(height, width, channels)
    else:
        flat_image = image_array.flatten()
        scrambled = flat_image[indices]
        scrambled_image = scrambled.reshape(height, width)
    
    return scrambled_image


def encrypt_image(input_path, output_path):

    # Load image
    image = Image.open(input_path)
    image_array = np.array(image)
    
    # Store original image info
    original_shape = image_array.shape
    original_mode = image.mode
    original_filename = input_path.split('/')[-1]
    
    # Generate chaos parameters
    # Using random initial values for security
    x0 = random.uniform(0.1, 0.9)  # Initial value
    r = random.uniform(3.7, 3.99)  # Control parameter
    
    # Calculate required sequence length
    if len(image_array.shape) == 3:
        total_pixels = image_array.shape[0] * image_array.shape[1]
    else:
        total_pixels = image_array.shape[0] * image_array.shape[1]
    
    # Generate chaotic sequence
    chaos_sequence = logistic_map(x0, r, total_pixels)
    
    # Scramble pixels
    encrypted_array = scramble_pixels(image_array, chaos_sequence)
    
    # Generate RSA key pair
    rsa_key = RSA.generate(2048)
    
    # Create formatted key string for user
    user_key = generate_rsa_key()
    
    # Prepare encryption metadata
    encryption_data = {
        'encrypted_image': encrypted_array,
        'x0': x0,
        'r': r,
        'shape': original_shape,
        'mode': original_mode,
        'filename': original_filename,
        'user_key': user_key,
        'public_key': rsa_key.publickey().export_key(),
        'private_key': rsa_key.export_key()
    }
    
    # Save encrypted data
    with open(output_path, 'wb') as f:
        pickle.dump(encryption_data, f)
    
    return user_key


def apply_additional_diffusion(image_array, chaos_sequence):

    # Convert chaos values to integers (0-255)
    chaos_bytes = np.array(chaos_sequence * 255, dtype=np.uint8)
    
    # Apply XOR operation
    if len(image_array.shape) == 3:
        height, width, channels = image_array.shape
        diffused = image_array.copy()
        for c in range(channels):
            flat_channel = diffused[:, :, c].flatten()
            chaos_key = chaos_bytes[:len(flat_channel)]
            flat_channel = np.bitwise_xor(flat_channel, chaos_key)
            diffused[:, :, c] = flat_channel.reshape(height, width)
    else:
        flat_image = image_array.flatten()
        chaos_key = chaos_bytes[:len(flat_image)]
        diffused = np.bitwise_xor(flat_image, chaos_key)
        diffused = diffused.reshape(image_array.shape)
    
    return diffused


if __name__ == '__main__':
    print("Testing encryption module...")
    test_key = generate_rsa_key()
    print(f"Generated test key: {test_key}")
